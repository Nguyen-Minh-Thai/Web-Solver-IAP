import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Convert body parser JSON syntax errors into JSON responses.
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ success: false, message: 'Invalid JSON body', error: err.message });
    }
    next(err);
  });

  // Solver API - run Python backend and capture JSON output
  let currentProcess: ChildProcessWithoutNullStreams | null = null;

  const isSolverActive = (proc: ChildProcessWithoutNullStreams | null) => {
    return proc !== null && proc.exitCode === null && proc.signalCode === null;
  };

  app.get('/api/solve/status', (req, res) => {
    return res.json({
      success: true,
      active: !!currentProcess && isSolverActive(currentProcess),
      hasProcess: !!currentProcess,
      pid: currentProcess?.pid ?? null,
      exitCode: currentProcess?.exitCode ?? null,
      signalCode: currentProcess?.signalCode ?? null,
    });
  });

  app.post('/api/solve', (req, res) => {
    console.log('[api/solve] incoming request', { body: req.body, currentProcess: currentProcess ? { pid: currentProcess.pid, exitCode: currentProcess.exitCode, signalCode: currentProcess.signalCode, killed: currentProcess.killed } : null });

    if (currentProcess && isSolverActive(currentProcess)) {
      return res.status(409).json({ success: false, message: 'Solver already running' });
    }
    if (currentProcess && !isSolverActive(currentProcess)) {
      console.log('[api/solve] stale solver process detected, clearing currentProcess');
      currentProcess = null;
    }

    try {
      const repoRoot = path.join(process.cwd(), '..', 'exam-scheduling-engine-main NSGA II');
      const pythonExe = process.env.PYTHON_PATH || 'python';
      const scriptPath = path.join(repoRoot, 'main.py');
      const cwd = repoRoot;
      //const config = req.body?.config || {};

      // Run the solver without creating Excel output during API solve.
      // const args: string[] = [
      //   scriptPath,
      //   '--skip-export',
      //   '--json-summary',
      // ];
      
      // --- ĐOẠN SỬA 1: Gửi cấu hình & dữ liệu từ frontend xuống Python qua stdin ---

      const dataDir = path.join(repoRoot, 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // 1. Ghi file dữ liệu cán bộ mới an toàn (Bọc nháy kép tránh lỗi dấu phẩy + Thêm BOM UTF-8)
      if (req.body?.staff && Array.isArray(req.body.staff) && req.body.staff.length > 0) {
        const staffCsvPath = path.join(dataDir, 'can_bo_new.csv');
        const headers = Object.keys(req.body.staff[0]).join(',');
        const rows = req.body.staff.map((s: any) => 
          Object.values(s).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        
        fs.writeFileSync(staffCsvPath, `\uFEFF${headers}\n${rows}`, 'utf-8');
        console.log(`[Node.js] Đã ghi đè file dữ liệu cán bộ mới: ${staffCsvPath}`);
      }

      // 2. Ghi file dữ liệu ca thi mới an toàn
      if (req.body?.shifts && Array.isArray(req.body.shifts) && req.body.shifts.length > 0) {
        const shiftCsvPath = path.join(dataDir, 'ca_thi_new.csv');
        const headers = Object.keys(req.body.shifts[0]).join(',');
        const rows = req.body.shifts.map((s: any) => 
          Object.values(s).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        
        fs.writeFileSync(shiftCsvPath, `\uFEFF${headers}\n${rows}`, 'utf-8');
        console.log(`[Node.js] Đã ghi đè file dữ liệu ca thi mới: ${shiftCsvPath}`);
      }
      // =================================================================

      
      const wrapperScript = path.join(repoRoot, 'backend_wrapper.py');
      const args: string[] = [
        wrapperScript,
        // '--backend-root',
        // repoRoot
      ];

      console.log(`Starting NSGA-II Python solver with: ${pythonExe}`);
      console.log(`Solver script: ${wrapperScript}`);
      console.log(`Working directory: ${cwd}`);
      console.log(`Solver args: ${args.join(' ')}`);

      const proc = spawn(pythonExe, args, {
        cwd,
        env: {
          ...process.env,
          PYTHONUTF8: '1',
          PYTHONIOENCODING: 'utf-8',
          PYTHONUNBUFFERED: '1',
        },
      });
      currentProcess = proc;

      // Gửi cấu hình trọng số & yêu cầu đè dữ liệu xuống Python qua stdin
      if (req.body) {
        proc.stdin.write(JSON.stringify(req.body));
        proc.stdin.end();
      }
      // --- HẾT ĐOẠN SỬA 1 ---

      // console.log(`Starting NSGA II Python solver with: ${pythonExe}`);
      // console.log(`Solver script: ${wrapperScript}`);
      // console.log(`Working directory: ${cwd}`);
      // console.log(`Solver args: ${args.join(' ')}`);
      
      

      let stdoutBuf = '';
      let stderrBuf = '';

      proc.stdout.on('data', (chunk: Buffer) => {
        const s = chunk.toString();
        stdoutBuf += s;
        // Mirror Python stdout to Node terminal so user can observe solver progress live
        try { console.log('[python stdout]', s); } catch (e) { /* ignore logging errors */ }
      });

      proc.stderr.on('data', (chunk: Buffer) => {
        stderrBuf += chunk.toString();
        console.error('[python stderr]', chunk.toString());
      });

      proc.on('error', (err: any) => {
        currentProcess = null;
        console.error('Python process error:', err);
        res.status(500).json({ success: false, message: String(err) });
      });

      const parseSolverJson = (raw: string) => {
        const trimmed = raw.trim();
        if (!trimmed) return null;

        // Try direct JSON first.
        try {
          return JSON.parse(trimmed);
        } catch (_) {
          // Fallback: extract the last JSON object from the combined stdout.
          const lastOpen = trimmed.lastIndexOf('{');
          const lastClose = trimmed.lastIndexOf('}');
          if (lastOpen >= 0 && lastClose > lastOpen) {
            const candidate = trimmed.slice(lastOpen, lastClose + 1);
            try {
              return JSON.parse(candidate);
            } catch (__) {
              return null;
            }
          }
          return null;
        }
      };

      proc.on('close', (code: number) => {
        currentProcess = null;
        if (code === 0) {
          const parsed: any = parseSolverJson(stdoutBuf);

          if (parsed?.success) {
            return res.json(parsed);
          }

          return res.json({
            success: true,
            message: 'Python NSGA II solver finished successfully.',
            algorithm: 'NSGA II',
            assignments: parsed?.assignments ?? [],
            metrics: parsed?.metrics ?? {},
            rawOutput: stdoutBuf,
          });
        }
        return res.status(500).json({ success: false, message: `Python solver exited with code ${code}`, raw: stdoutBuf, stderr: stderrBuf });
      });
    } catch (err: any) {
      currentProcess = null;
      res.status(500).json({ success: false, message: err.message });
    }
  });


  // =================================================================
  // 🚀 API NHẬN DATA CSV THUẦN TỪ FRONTEND VÀ GHI THÀNH FILE VẬT LÝ
  // =================================================================
  app.post('/api/upload-csv', (req, res) => {
    const { type, filename, text } = req.body;
    console.log(`[api/upload-csv] Nhận yêu cầu lưu file: ${filename} (Loại: ${type})`);

    if (!text) {
      return res.status(400).json({ success: false, message: 'Dữ liệu file trống!' });
    }

    try {
      // Xác định đường dẫn đến thư mục data của Engine Python
      const repoRoot = path.join(process.cwd(), '..', 'exam-scheduling-engine-main NSGA II');
      const dataDir = path.join(repoRoot, 'data');

      // Tự động tạo thư mục 'data' nếu chưa tồn tại
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Ép tên file cố định theo chuẩn để Python dễ nạp (hoặc dùng filename tùy chọn)
      const targetFileName = type === 'staff' ? 'can_bo_new.csv' : 'ca_thi_new.csv';
      const targetPath = path.join(dataDir, targetFileName);

      // Ghi file kèm mã hóa BOM UTF-8 để tránh lỗi tiếng Việt có dấu khi Excel/Python đọc
      fs.writeFileSync(targetPath, `\uFEFF${text}`, 'utf-8');
      console.log(`[Node.js] Đã ghi file thành công: ${targetPath}`);

      return res.json({ 
        success: true, 
        message: `Đã lưu file thành công thành ${targetFileName}` 
      });
    } catch (error: any) {
      console.error('[api/upload-csv] Lỗi ghi file:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  });
  
  //----------------------------------------------------------------------------------



  app.post('/api/solve/stop', async (req, res) => {
    if (!currentProcess) return res.json({ success: false, message: 'No solver running' });
    try {
      currentProcess.kill();
      currentProcess = null;
      return res.json({ success: true, message: 'Solver stopped' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Export Excel - run backend exporter and return generated file
  app.post('/api/export', async (req, res) => {
    try {
      const repoRoot = path.join(process.cwd(), '..', 'exam-scheduling-engine-main NSGA II');
      const defaultVenvPython = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
      const pythonExe = process.env.PYTHON_PATH || (fs.existsSync(defaultVenvPython) ? defaultVenvPython : 'python');
      const scriptPath = path.join(repoRoot, 'main.py');
      const cwd = repoRoot;

      // Run the exporter by calling main without --json so it writes outputs/Ket_Qua_Xep_Lich.xlsx
      //const args = [scriptPath];
      const wrapperScript = path.join(repoRoot, 'backend_wrapper.py');
      const args = [
        wrapperScript,
        // '--backend-root',
        // repoRoot
      ];

      console.log(`Running NSGA II exporter: ${pythonExe} ${args.join(' ')}`);
      const proc = spawn(pythonExe, args, { cwd, env: { ...process.env, PYTHONUTF8: '1', PYTHONUNBUFFERED: '1' } });

      let stderr = '';
      proc.stdout.on('data', (c: Buffer) => {
        // Mirror exporter stdout so user can see progress/logs
        try { console.log('[exporter stdout]', c.toString()); } catch (e) {}
      });
      proc.stderr.on('data', (c: Buffer) => {
        stderr += c.toString();
        console.error('[exporter stderr]', c.toString());
      });

      proc.on('close', (code: number) => {
        const outFile = path.join(repoRoot, 'outputs', 'Ket_Qua_Xep_Lich.xlsx');
        if (fs.existsSync(outFile)) {
          return res.download(outFile, 'Ket_Qua_Xep_Lich.xlsx');
        }
        return res.status(500).json({ success: false, message: `Export failed (code ${code})`, stderr });
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

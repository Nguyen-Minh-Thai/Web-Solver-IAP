# import os
# import sys
# import pandas as pd


# def _read_input_file(input_path):
#     ext = os.path.splitext(input_path)[1].lower()
#     if ext == '.csv':
#         return pd.read_csv(input_path, dtype=str, encoding='utf-8', on_bad_lines='skip')
#     if ext in ['.xlsx', '.xls']:
#         return pd.read_excel(input_path)
#     raise ValueError(f'Unsupported input file type: {input_path}')


# def load_data(shift_file, staff_file):
#     try:
#         shift_df = _read_input_file(shift_file)
#         staff_df = _read_input_file(staff_file)

#         # Chuẩn hóa chuỗi: loại bỏ khoảng trắng thừa ở hai đầu
#         for df in [shift_df, staff_df]:
#             for col in df.select_dtypes(include=['object']).columns:
#                 df[col] = df[col].astype(str).str.strip()

#         # Đảm bảo kiểu dữ liệu cần thiết cho việc tính toán
#         shift_df['Số lượng cán bộ cần thiết'] = (
#             pd.to_numeric(shift_df['Số lượng cán bộ cần thiết'], errors='coerce')
#             .fillna(1)
#             .astype(int)
#         )
#         shift_df['MS Ca thi'] = shift_df['MS Ca thi'].astype(str)

#         # Kiểm tra tính toàn vẹn của dữ liệu đầu vào (Cột bắt buộc)
#         required_shift_cols = ['MS Ca thi', 'Ca thi', 'Thứ', 'Ngày', 'Cơ sở', 'Số lượng cán bộ cần thiết']
#         required_staff_cols = ['MS của CÁN BỘ COI THI', 'Tuổi']
        
#         for col in required_shift_cols:
#             if col not in shift_df.columns:
#                 print(f"[WARNING] Missing column '{col}' in shift data file.")
                
#         for col in required_staff_cols:
#             if col not in staff_df.columns:
#                 print(f"[WARNING] Missing column '{col}' in staff data file.")

#         print(f"[INFO] Data loaded successfully: {len(shift_df)} shifts, {len(staff_df)} staff members.")
#         return shift_df, staff_df

#     except FileNotFoundError as e:
#         print(f"[ERROR] File not found: {e}")
#         sys.exit(1)
#     except Exception as e:
#         print(f"[ERROR] Failed to read data files: {e}")
#         sys.exit(1)

import pandas as pd
import os

def clean_column_names(df):
    """
    Chuẩn hóa tên cột thông minh: Khử hoàn toàn dấu tiếng Việt và khoảng trắng 
    để dò tìm chính xác bất chấp lỗi font mã hóa hệ thống, bảo toàn độc lập giữa ID cán bộ và ID ca thi.
    """
    mapping = {}
    for col in df.columns:
        c = str(col).lower().strip()
        
        # Bảng mã khử dấu Tiếng Việt thô chống lỗi so khớp chuỗi
        replacements = {
            'á':'a','à':'a','ả':'a','ã':'a','ạ':'a','ă':'a','ắ':'a','ằ':'a','ẳ':'a','ẵ':'a','ặ':'a','â':'a','ấ':'a','ầ':'a','ẩ':'a','ẫ':'a','ậ':'a',
            'é':'e','è':'e','ẻ':'e','ẽ':'e','ẹ':'e','ê':'e','ế':'e','ề':'e','ể':'e','ễ':'e','ệ':'e',
            'í':'i','ì':'i','ỉ':'i','ĩ':'i','ị':'i',
            'ó':'o','ò':'o','ỏ':'o','õ':'o','ọ':'o','ô':'o','ố':'o','ồ':'o','ổ':'o','ỗ':'o','ộ':'o','ơ':'o','ớ':'o','ờ':'o','ở':'o','ỡ':'o','ợ':'o',
            'ú':'u','ù':'u','ủ':'u','ũ':'u','ụ':'u','ư':'u','ứ':'u','ừ':'u','ử':'u','ữ':'u','ự':'u',
            'ý':'y','ỳ':'y','ỷ':'y','ỹ':'y','ỵ':'y',
            'đ':'d'
        }
        c_unaccented = c
        for k, v in replacements.items():
            c_unaccented = c_unaccented.replace(k, v)
        
        # 1. Kiểm tra các cột khoảng cách địa lý
        if 'khoang cach' in c_unaccented or 'dist' in c_unaccented:
            if 'cs1' in c_unaccented or '1' in c_unaccented: mapping[col] = 'Khoảng cách đến CS1'
            elif 'cs2' in c_unaccented or '2' in c_unaccented: mapping[col] = 'Khoảng cách đến CS2'
            continue
        if 'cs1' in c_unaccented:
            mapping[col] = 'Khoảng cách đến CS1'
            continue
        if 'cs2' in c_unaccented:
            mapping[col] = 'Khoảng cách đến CS2'
            continue

        # 2. Kiểm tra cột số lượng cán bộ yêu cầu
        if 'so luong' in c_unaccented or 'thiet' in c_unaccented:
            if 'can bo' in c_unaccented or 'cb' in c_unaccented:
                mapping[col] = 'Số lượng cán bộ cần thiết'
                continue

        # 3. Phân loại cột ID cốt lõi (Mã cán bộ / Mã ca thi) dựa trên chuỗi đã khử dấu
        if 'ma' in c_unaccented or 'ms' in c_unaccented or 'id' in c_unaccented:
            if 'can bo' in c_unaccented or 'cb' in c_unaccented or 'coi thi' in c_unaccented:
                mapping[col] = 'Mã cán bộ'
                continue
            elif 'ca thi' in c_unaccented or 'ca' in c_unaccented:
                mapping[col] = 'Mã ca thi'
                continue

        # 4. Bảo toàn cột "Ca thi" thô dạng mô tả chuỗi thời gian
        if 'ca thi' in c_unaccented or (('ca' in c_unaccented or 'thi' in c_unaccented) and 'ma' not in c_unaccented and 'ms' not in c_unaccented):
            if 'can bo' not in c_unaccented and 'coi thi' not in c_unaccented:
                mapping[col] = 'Ca thi'
                continue
            else:
                mapping[col] = 'Mã cán bộ'
                continue

        # 5. Các cột thông tin cơ bản khác
        if 'tuoi' in c_unaccented: 
            mapping[col] = 'Tuổi'
        elif 'gioi tinh' in c_unaccented or 'gender' in c_unaccented: 
            mapping[col] = 'Giới tính'
    
    return df.rename(columns=mapping)

def load_data(shift_path, staff_path):
    """
    Loads shift and staff data from Excel or CSV files with smart column auto-fixing.
    """
    try:
        # --- ĐỌC FILE CA THI ---
        if shift_path.endswith('.xlsx') or shift_path.endswith('.xls'):
            shift_df = pd.read_excel(shift_path)
        else:
            shift_df = pd.read_csv(shift_path, encoding='utf-8-sig')

        # --- ĐỌC FILE CÁN BỘ ---
        if staff_path.endswith('.xlsx') or staff_path.endswith('.xls'):
            staff_df = pd.read_excel(staff_path)
        else:
            staff_df = pd.read_csv(staff_path, encoding='utf-8-sig')

        # Ép cơ chế nhận diện tên cột thông minh chống lỗi font mã hóa Windows
        shift_df = clean_column_names(shift_df)
        staff_df = clean_column_names(staff_df)

        # --- ĐÁNH GIÁ SƠ BỘ VỀ NHẦM LẪN FILE SHIFT/STAFF ---
        if 'Mã ca thi' in staff_df.columns and ('Mã cán bộ' in shift_df.columns or 'MS của CÁN BỘ COI THI' in shift_df.columns):
            print(f"[WARN] staff_df có cột ca thi. Hoán đổi shift_df và staff_df để xử lý.")
            shift_df, staff_df = staff_df, shift_df

        # --- ĐẢM BẢO CÓ ĐỦ CỘT KHÔNG BỊ CRASH ---
        if 'Số lượng cán bộ cần thiết' not in shift_df.columns:
            shift_df['Số lượng cán bộ cần thiết'] = 2
        if 'Tuổi' not in staff_df.columns: staff_df['Tuổi'] = 40
        if 'Khoảng cách đến CS1' not in staff_df.columns: staff_df['Khoảng cách đến CS1'] = 0.0
        if 'Khoảng cách đến CS2' not in staff_df.columns: staff_df['Khoảng cách đến CS2'] = 0.0

        # --- CHUẨN HÓA KIỂU DỮ LIỆU CỘT VẬT LÝ ---
        shift_df['Số lượng cán bộ cần thiết'] = pd.to_numeric(shift_df['Số lượng cán bộ cần thiết'], errors='coerce').fillna(2).astype(int)
        staff_df['Tuổi'] = pd.to_numeric(staff_df['Tuổi'], errors='coerce').fillna(40).astype(int)
        staff_df['Khoảng cách đến CS1'] = pd.to_numeric(staff_df['Khoảng cách đến CS1'], errors='coerce').fillna(0.0)
        staff_df['Khoảng cách đến CS2'] = pd.to_numeric(staff_df['Khoảng cách đến CS2'], errors='coerce').fillna(0.0)

        # Định dạng chuỗi văn bản sạch cho các ID cốt lõi
        if 'Mã cán bộ' in staff_df.columns:
            staff_df['Mã cán bộ'] = staff_df['Mã cán bộ'].astype(str).str.strip()
        if 'Mã ca thi' in shift_df.columns:
            shift_df['Mã ca thi'] = shift_df['Mã ca thi'].astype(str).str.strip()

        # ==========================================================================
        # ĐỒNG BỘ DỰ PHÒNG TÊN CỘT (ÉP CHUNG VỀ 'Mã cán bộ')
        # ==========================================================================
        # 1. Đồng bộ cho file Ca thi (shift_df)
        if 'Ca thi' in shift_df.columns and 'Mã ca thi' not in shift_df.columns:
            shift_df['Mã ca thi'] = shift_df['Ca thi']
        if 'Mã ca thi' in shift_df.columns and 'Ca thi' not in shift_df.columns:
            shift_df['Ca thi'] = shift_df['Mã ca thi']
        if 'Mã ca thi' in shift_df.columns:
            shift_df['MS Ca thi'] = shift_df['Mã ca thi']

        # 2. Đồng bộ cho file Cán bộ (staff_df) - Chốt dùng 'Mã cán bộ'
        if 'MS của CÁN BỘ COI THI' in staff_df.columns:
            staff_df['Mã cán bộ'] = staff_df['MS của CÁN BỘ COI THI']
        if 'Mã cán bộ' in staff_df.columns:
            staff_df['MS của CÁN BỘ COI THI'] = staff_df['Mã cán bộ'] # Giữ lại map cho thuật toán cũ
        # ==========================================================================

        print(f"[INFO] Data loaded successfully: {len(shift_df)} shifts, {len(staff_df)} staff members.")
        return shift_df, staff_df

    except Exception as e:
        err_msg = str(e).encode('ascii', 'ignore').decode('ascii')
        print(f"[ERROR] Failed to read data files. Loi: {err_msg}")
        raise e
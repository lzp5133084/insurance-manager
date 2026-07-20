import tkinter as tk
from tkinter import ttk
from datetime import datetime

def calculate_age(id_card):
    id_card = id_card.strip().upper()
    
    if len(id_card) == 18:
        if not id_card[:17].isdigit():
            return None, "身份证号前17位必须是数字"
        if not (id_card[17].isdigit() or id_card[17] == 'X'):
            return None, "身份证号最后一位必须是数字或X"
        birth_str = id_card[6:14]
        gender_digit = id_card[-2]
    elif len(id_card) == 15:
        if not id_card.isdigit():
            return None, "身份证号必须全为数字"
        birth_str = '19' + id_card[6:12]
        gender_digit = id_card[-1]
    else:
        return None, "身份证号必须是15位或18位"
    
    try:
        birth_date = datetime.strptime(birth_str, '%Y%m%d')
    except ValueError:
        return None, "无效的出生日期"
    
    today = datetime.now()
    age = today.year - birth_date.year
    
    if (today.month, today.day) < (birth_date.month, birth_date.day):
        age -= 1
    
    if age < 0:
        return None, "出生日期不能大于当前日期"
    
    gender = "女" if int(gender_digit) % 2 == 0 else "男"
    
    return age, gender

def on_calculate():
    id_card = entry_id.get()
    age, result = calculate_age(id_card)
    
    if age is not None:
        result_text = f"年龄：{age}岁\n性别：{result}"
        label_result.config(text=result_text, fg="#0066cc")
    else:
        label_result.config(text=result, fg="#cc0000")

def on_transparency_change(val):
    root.attributes('-alpha', float(val))

def on_close():
    root.destroy()

root = tk.Tk()
root.title("身份证年龄计算器")
root.geometry("320x280")
root.resizable(False, False)

window_bg = "#f8fafc"
frame_bg = "#ffffff"
accent_color = "#3b82f6"

root.configure(bg=window_bg)

main_frame = ttk.Frame(root, padding="20")
main_frame.pack(fill=tk.BOTH, expand=True)

style = ttk.Style()
style.theme_use('clam')
style.configure('TFrame', background=window_bg)
style.configure('TLabel', background=window_bg, font=('Microsoft YaHei', 10))
style.configure('TButton', font=('Microsoft YaHei', 10), padding=6)
style.map('TButton', background=[('active', accent_color), ('pressed', '#2563eb')])

label_title = ttk.Label(main_frame, text="身份证年龄计算器", font=('Microsoft YaHei', 14, 'bold'), foreground=accent_color)
label_title.pack(pady=(0, 20))

label_id = ttk.Label(main_frame, text="身份证号码：")
label_id.pack(anchor=tk.W, pady=(0, 5))

entry_id = ttk.Entry(main_frame, width=22, font=('Microsoft YaHei', 11))
entry_id.pack(fill=tk.X, pady=(0, 15))
entry_id.focus_set()

btn_calculate = ttk.Button(main_frame, text="计算", command=on_calculate)
btn_calculate.pack(fill=tk.X, pady=(0, 15))

label_result = ttk.Label(main_frame, text="", font=('Microsoft YaHei', 12, 'bold'), justify=tk.CENTER)
label_result.pack(pady=(0, 20))

label_transparency = ttk.Label(main_frame, text="窗口透明度：")
label_transparency.pack(anchor=tk.W, pady=(0, 5))

scale_transparency = ttk.Scale(main_frame, from_=0.3, to=1.0, value=0.9, orient=tk.HORIZONTAL, 
                               command=on_transparency_change, length=250)
scale_transparency.pack(fill=tk.X)

root.bind('<Return>', lambda e: on_calculate())

root.mainloop()
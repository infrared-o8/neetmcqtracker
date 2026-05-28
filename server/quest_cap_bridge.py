import os
import time
import customtkinter as ctk
from PIL import Image, ImageGrab
import pyautogui
from datetime import datetime
import sys
import json
import base64
import re

# --- CONFIGURATION ---
OBSIDIAN_VAULT_PATH = r"C:\Users\shahe\OneDrive\Documents\Obsidian Vault"
ATTACHMENT_FOLDER = "attachments"
NOTE_NAME = "my dreams.md"
DEFAULT_TARGET_HEADING = "# Final NEET Prep:" 
# ---------------------

ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

class QuestCapPro(ctk.CTk):
    def __init__(self, mode="capture", initial_text="", target_header=None):
        super().__init__()
        self.mode = mode
        self.initial_text = initial_text
        self.target_header = (target_header or DEFAULT_TARGET_HEADING).strip()

        # Setup Window
        self.title("QuestCap Pro Bridge")
        self.attributes("-topmost", True)
        self.geometry("800x500")
        
        if self.mode == "capture":
            # 1. Capture Full Screen
            time.sleep(0.3) 
            full_img = pyautogui.screenshot()
            w, h = full_img.size
            
            # 2. Split Screen
            self.left_img = full_img.crop((0, 0, w // 2, h))
            self.right_img = full_img.crop((w // 2, 0, w, h))
            self.setup_capture_ui()
            
        elif self.mode == "paste":
            # Triggered when user Ctrl+V in the web app
            try:
                self.active_img = ImageGrab.grabclipboard()
                if not isinstance(self.active_img, Image.Image):
                    print("[ERROR] No image found in clipboard.")
                    self.destroy()
                    return
            except Exception as e:
                print(f"[ERROR] Clipboard Access Failed: {e}")
                self.destroy()
                return
            self.setup_pasted_ui()
            
        else:
            # Mode: Append (Text Only)
            self.setup_append_only_ui()

    def setup_capture_ui(self):
        self.grid_columnconfigure((0, 1), weight=1)
        self.grid_rowconfigure(1, weight=1)
        self.label = ctk.CTkLabel(self, text="Select Question Side (Screenshot)", font=ctk.CTkFont(size=20, weight="bold"))
        self.label.grid(row=0, column=0, columnspan=2, pady=20)

        l_img_ctk = ctk.CTkImage(light_image=self.left_img, dark_image=self.left_img, size=(350, 200))
        r_img_ctk = ctk.CTkImage(light_image=self.right_img, dark_image=self.right_img, size=(350, 200))

        self.l_btn = ctk.CTkButton(self, image=l_img_ctk, text="Left Side", compound="top",
                                   command=lambda: self.process_image(self.left_img), fg_color="#2b2b2b", hover_color="#3d3d3d")
        self.l_btn.grid(row=1, column=0, padx=20, pady=10, sticky="nsew")

        self.r_btn = ctk.CTkButton(self, image=r_img_ctk, text="Right Side", compound="top",
                                   command=lambda: self.process_image(self.right_img), fg_color="#2b2b2b", hover_color="#3d3d3d")
        self.r_btn.grid(row=1, column=1, padx=20, pady=10, sticky="nsew")
        self.hint = ctk.CTkLabel(self, text="Alt+L (Left) | Alt+R (Right) | Esc (Cancel)", font=ctk.CTkFont(size=12))
        self.hint.grid(row=2, column=0, columnspan=2, pady=10)

        self.bind("<Alt-l>", lambda e: self.process_image(self.left_img))
        self.bind("<Alt-r>", lambda e: self.process_image(self.right_img))
        self.bind("<Escape>", lambda e: self.destroy())

    def setup_pasted_ui(self):
        # Preview pasted image and ask for answer IMMEDIATELY
        self.label = ctk.CTkLabel(self, text="Processing Pasted Image", font=ctk.CTkFont(size=20, weight="bold"))
        self.label.pack(pady=20)
        
        preview_size = (600, 300)
        img_ctk = ctk.CTkImage(light_image=self.active_img, dark_image=self.active_img, size=preview_size)
        self.img_label = ctk.CTkLabel(self, image=img_ctk, text="")
        self.img_label.pack(pady=10)
        
        self.after(500, lambda: self.process_image(self.active_img))

    def setup_append_only_ui(self):
        self.label = ctk.CTkLabel(self, text=f"Targeting: {self.target_header}", font=ctk.CTkFont(size=16))
        self.label.pack(pady=40)
        self.after(100, lambda: self.process_text_only())

    def process_text_only(self):
        new_entry = f"{self.initial_text}\n"
        self.append_to_obsidian(new_entry)
        self.destroy()

    def process_image(self, img_obj):
        dialog = ctk.CTkInputDialog(text="Enter answer (e.g., A):", title="QuestCap")
        user_option = dialog.get_input()
        if user_option is None: user_option = "x"
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        img_filename = f"Quest_{timestamp}.png"
        
        save_dir = os.path.join(OBSIDIAN_VAULT_PATH, ATTACHMENT_FOLDER)
        if not os.path.exists(save_dir): os.makedirs(save_dir)
        
        img_obj.save(os.path.join(save_dir, img_filename))

        new_entry = f"![[{ATTACHMENT_FOLDER}/{img_filename}]]\nanswer is ||option {user_option}||\n"
        if self.initial_text:
            new_entry = f"\n### {self.initial_text}\n" + new_entry

        self.append_to_obsidian(new_entry)
        self.destroy()

    def append_to_obsidian(self, entry):
        note_path = os.path.join(OBSIDIAN_VAULT_PATH, NOTE_NAME)
        print(f"[Bridge] Target Note: {note_path}")
        print(f"[Bridge] Target Header: '{self.target_header}'")

        if not os.path.exists(note_path):
            print(f"[ERROR] Note not found at {note_path}")
            return

        with open(note_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

        # 1. Find the target header index (Flexible containment check)
        idx = -1
        for i, line in enumerate(lines):
            if self.target_header in line:
                idx = i
                break
        
        if idx == -1:
            print(f"[WARNING] Target header '{self.target_header}' not found. Falling back to default: {DEFAULT_TARGET_HEADING}")
            self.target_header = DEFAULT_TARGET_HEADING.strip()
            for i, line in enumerate(lines):
                if self.target_header in line:
                    idx = i
                    break
            
            if idx == -1:
                print(f"[ERROR] Default fallback header '{self.target_header}' also not found. Aborting.")
                return

        print(f"[Bridge] Header matched at line {idx + 1}")

        # 2. Smart Numbering: Search UPWARDS from the header
        smart_prefix = ""
        for i in range(idx - 1, -1, -1):
            clean_line = lines[i].strip()
            if not clean_line: continue
            match = re.match(r"^(\d+)\.", clean_line)
            if match:
                next_num = int(match.group(1)) + 1
                smart_prefix = f"{next_num}. "
                print(f"[Bridge] Detected list. Continuing with: {next_num}")
                break
        
        final_entry = f"{smart_prefix}{entry}"
        if not final_entry.endswith("\n"): final_entry += "\n"
        
        # 3. Insert STRICTLY ABOVE the header
        lines.insert(idx, final_entry)
        print(f"[Bridge] Successfully inserted entry ABOVE '{self.target_header}' at line {idx + 1}")
            
        with open(note_path, "w", encoding="utf-8") as f:
            f.writelines(lines)

if __name__ == "__main__":
    mode = "capture"
    text = ""
    target_header = None
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "--base64" and len(sys.argv) > 2:
            try:
                raw_data = base64.b64decode(sys.argv[2]).decode('utf-8')
                data = json.loads(raw_data)
                mode = data.get("mode", "capture")
                text = data.get("text", "")
                target_header = data.get("header") # Matches key sent from server
            except Exception as e:
                print(f"[ERROR] Argument Decode Failed: {e}")
        else:
            try:
                data = json.loads(sys.argv[1])
                mode = data.get("mode", "capture")
                text = data.get("text", "")
                target_header = data.get("header")
            except:
                pass
                
    app = QuestCapPro(mode=mode, initial_text=text, target_header=target_header)
    app.mainloop()

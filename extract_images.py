import os
import zipfile

def extract_images_from_docx(docx_path, output_folder="docs/assets_extracted"):
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
        
    with zipfile.ZipFile(docx_path, 'r') as docx:
        for file in docx.namelist():
            if file.startswith('word/media/'):
                docx.extract(file, output_folder)
                print(f"Extracted: {file}")

if __name__ == "__main__":
    extract_images_from_docx("NexusOS_Enterprise_Technical_Manual.docx")

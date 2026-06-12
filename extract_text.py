import os
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH

def extract_content(file_path, output_dir="extracted_content"):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    doc = Document(file_path)
    content = []
    
    img_counter = 0
    for i, p in enumerate(doc.paragraphs):
        p_data = {
            "text": p.text,
            "style": p.style.name,
            "images": []
        }
        
        # Extract images from this paragraph
        for run in p.runs:
            if 'picture' in run.element.xml:
                # This is a bit complex in python-docx, we need to find the image part
                # Simplest way is to look at doc.inline_shapes if it was added that way,
                # but run.element.xml contains the rId.
                pass
        
        content.append(p_data)

    # Actually images are stored in doc.part.related_parts
    # and doc.inline_shapes for positions
    
    # Let's just grab the text for now and assume images are still in docs/assets
    # based on the text context (e.g. "Figure: ...")
    
    with open("extracted_text.txt", "w", encoding="utf-8") as f:
        for entry in content:
            f.write(f"STYLE: {entry['style']}\n")
            f.write(f"TEXT: {entry['text']}\n")
            f.write("-" * 20 + "\n")

if __name__ == "__main__":
    extract_content("NexusOS_Enterprise_Technical_Manual.docx")

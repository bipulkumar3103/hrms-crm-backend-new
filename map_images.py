from docx import Document
import os

def map_images(file_path):
    doc = Document(file_path)
    mapping = []
    
    # We need to find which rId corresponds to which image file
    # This is tricky without low-level access, but we can look at the paragraphs
    # and use the fact that doc.inline_shapes stores them in order.
    
    shapes = list(doc.inline_shapes)
    shape_index = 0
    
    for i, p in enumerate(doc.paragraphs):
        # Does this paragraph have an image?
        has_image = False
        for run in p.runs:
            if 'picture' in run.element.xml:
                has_image = True
                break
        
        if has_image and shape_index < len(shapes):
            # We found an image in paragraph i
            # In a better script we'd get the actual filename, 
            # but let's assume the order in shapes matches the order in word/media/
            # and use the text context to identify the section.
            mapping.append({
                "paragraph_index": i,
                "text_context": p.text[:50],
                "shape_index": shape_index
            })
            shape_index += 1
            
    return mapping

if __name__ == "__main__":
    m = map_images("NexusOS_Enterprise_Technical_Manual.docx")
    for entry in m:
        print(entry)

import os
import torch
from torchvision import transforms
from PIL import Image

def prepare_radar_tensors(loc_name="ghaziabad", image_size=(64, 64)):
    base_dir = os.path.dirname(__file__)
    image_dir = os.path.join(base_dir, f"radar_data_{loc_name}")
    
    transform = transforms.Compose([
        transforms.Resize(image_size),
        transforms.Grayscale(num_output_channels=1),
        transforms.ToTensor()
    ])
    
    if not os.path.exists(image_dir):
        print(f"Error: Directory {image_dir} does not exist.")
        return None
        
    valid_extensions = (".png", ".jpg", ".jpeg")
    image_files = sorted([f for f in os.listdir(image_dir) if f.endswith(valid_extensions)])
    
    if len(image_files) < 4:
        print(f"Error: Need at least 4 images for {loc_name}. Found {len(image_files)}.")
        return None
        
    latest_files = image_files[-4:]
    tensor_sequence = []
    
    for file_name in latest_files:
        file_path = os.path.join(image_dir, file_name)
        try:
            img = Image.open(file_path).convert('RGB')
            tensor_sequence.append(transform(img))
        except Exception as e:
            print(f"Failed to process {file_name}: {e}")
            return None
            
    sequence_tensor = torch.stack(tensor_sequence)
    output_path = os.path.join(base_dir, f"radar_sequence_tensor_{loc_name}.pt")
    
    torch.save(sequence_tensor, output_path)
    print(f"Sequence tensor successfully saved to {output_path}")
    return sequence_tensor

if __name__ == "__main__":
    prepare_radar_tensors(loc_name="ghaziabad")
    prepare_radar_tensors(loc_name="patna")
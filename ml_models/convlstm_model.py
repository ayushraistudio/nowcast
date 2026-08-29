import torch
import torch.nn as nn

class ConvLSTMCell(nn.Module):
    def __init__(self, input_dim, hidden_dim, kernel_size, bias):
        super(ConvLSTMCell, self).__init__()
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.kernel_size = kernel_size
        self.padding = kernel_size[0] // 2, kernel_size[1] // 2
        self.bias = bias
        
        self.conv = nn.Conv2d(
            in_channels=self.input_dim + self.hidden_dim,
            out_channels=4 * self.hidden_dim,
            kernel_size=self.kernel_size,
            padding=self.padding,
            bias=self.bias
        )

    def forward(self, input_tensor, cur_state):
        h_cur, c_cur = cur_state
        combined = torch.cat([input_tensor, h_cur], dim=1)
        combined_conv = self.conv(combined)
        cc_i, cc_f, cc_o, cc_g = torch.split(combined_conv, self.hidden_dim, dim=1)
        
        i = torch.sigmoid(cc_i)
        f = torch.sigmoid(cc_f)
        o = torch.sigmoid(cc_o)
        g = torch.tanh(cc_g)
        
        c_next = f * c_cur + i * g
        h_next = o * torch.tanh(c_next)
        return h_next, c_next

    def init_hidden(self, batch_size, image_size):
        height, width = image_size
        return (torch.zeros(batch_size, self.hidden_dim, height, width, device=self.conv.weight.device),
                torch.zeros(batch_size, self.hidden_dim, height, width, device=self.conv.weight.device))

class SpatialRiskPredictor(nn.Module):
    def __init__(self):
        super(SpatialRiskPredictor, self).__init__()
        # Input has 1 channel (grayscale), output hidden state has 16 channels
        self.convlstm_cell = ConvLSTMCell(input_dim=1, hidden_dim=16, kernel_size=(3, 3), bias=True)
        
        # Downsample the spatial data to calculate a single risk probability
        self.flatten = nn.Flatten()
        # 16 channels * 64 height * 64 width = 65536 features
        self.fc1 = nn.Linear(16 * 64 * 64, 128)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(128, 1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        # x shape expects: (Batch, Sequence, Channels, Height, Width)
        batch_size, seq_len, _, height, width = x.size()
        h, c = self.convlstm_cell.init_hidden(batch_size, (height, width))
        
        # Pass each frame in the sequence through the ConvLSTM cell
        for t in range(seq_len):
            h, c = self.convlstm_cell(x[:, t, :, :, :], (h, c))
            
        # Use the final hidden state to predict the risk score
        out = self.flatten(h)
        out = self.fc1(out)
        out = self.relu(out)
        out = self.fc2(out)
        out = self.sigmoid(out)
        return out

def test_model():
    print("Initializing ConvLSTM Spatial Predictor...")
    model = SpatialRiskPredictor()
    
    # Load the tensor generated in the previous step
    tensor_path = "radar_sequence_tensor.pt"
    try:
        sequence_tensor = torch.load(tensor_path)
        print(f"Loaded tensor shape: {sequence_tensor.shape}")
        
        # PyTorch expects a batch dimension: (Batch, Sequence, Channel, Height, Width)
        # We add a batch dimension of 1 using unsqueeze
        batched_tensor = sequence_tensor.unsqueeze(0)
        print(f"Batched tensor shape for model: {batched_tensor.shape}")
        
        # Run inference
        with torch.no_grad():
            risk_score = model(batched_tensor)
            
        print("\n--- Model Output ---")
        print(f"Calculated Spatial Risk Score: {risk_score.item():.4f} (0.0 to 1.0)")
        
        # Save this untrained model weights to be used in FastAPI backend
        torch.save(model.state_dict(), "convlstm_weights.pth")
        print("Model initialized and weights saved successfully to convlstm_weights.pth")
        
    except FileNotFoundError:
        print(f"Error: {tensor_path} not found. Please run radar_tensor_prep.py first.")

if __name__ == "__main__":
    test_model()
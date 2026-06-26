// CreateEpnRequest.cs
public class CreateEpnRequest
{
    public string Epn { get; set; } = "";
    public int CavityCount { get; set; }
    public Dictionary<int, CavityDto> Cavities { get; set; } = new();
}


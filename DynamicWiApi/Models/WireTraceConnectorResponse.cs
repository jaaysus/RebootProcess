namespace DynamicWiApi.Models
{
    public class WireTraceConnectorResponse
    {
        public string SourceConnector { get; set; } = string.Empty;
        public int CavityCount { get; set; }
        public List<WireTraceSourceCavityDto> SourceCavities { get; set; } = new();
        public List<WireTraceDestinationDto> Destinations { get; set; } = new();
    }

    public class WireTraceSourceCavityDto
    {
        public string Cav { get; set; } = string.Empty;
        public string WireNb { get; set; } = string.Empty;
        public bool IsSelected { get; set; }
    }

    public class WireTraceDestinationDto
    {
        public string Name { get; set; } = string.Empty;
        public bool IsSplice { get; set; }
        public string Station { get; set; } = string.Empty;
        public List<WireTraceDestinationLegDto> Legs { get; set; } = new();
        public List<WireTraceSpliceReachDto> Reaches { get; set; } = new();
    }

    public class WireTraceDestinationLegDto
    {
        public int SourceLegId { get; set; }
        public string SourceCav { get; set; } = string.Empty;
        public string WireNb { get; set; } = string.Empty;
        public string Cavity { get; set; } = string.Empty;
        public string Station { get; set; } = string.Empty;
        public bool IsLocal { get; set; }
    }

    public class WireTraceSpliceReachDto
    {
        public string Node { get; set; } = string.Empty;
        public string Station { get; set; } = string.Empty;
    }
}
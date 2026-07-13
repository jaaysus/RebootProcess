namespace DynamicWiApi.Models
{
    public class WireTraceStationLegsResponse
    {
        public string StationName { get; set; } = string.Empty;
        public int LegCount { get; set; }
        public List<string> StationModules { get; set; } = new();
        public List<WireTraceLegDto> Legs { get; set; } = new();
    }

    public class WireTraceLegDto
    {
        public int LegId { get; set; }
        public string WireNb { get; set; } = string.Empty;
        public string Node { get; set; } = string.Empty;
        public string Cav { get; set; } = string.Empty;
        public string? Splice { get; set; }
        public List<WireTraceTerminalDto> Reaches { get; set; } = new();
    }

    public class WireTraceTerminalDto
    {
        public string Station { get; set; } = string.Empty;
        public string Node { get; set; } = string.Empty;
        public string Cav { get; set; } = string.Empty;
        public string? Via { get; set; }
        public bool IsLocal { get; set; }
    }
}
namespace DynamicWiApi.Models
{
    public class WireTraceProcessResponse
    {
        public List<string> IncludedModules { get; set; } = new();
        public int ActiveWireCount { get; set; }
        public List<WireTraceStationInfo> Stations { get; set; } = new();
        public string Status { get; set; } = string.Empty;
        public string? ErrorMessage { get; set; }
    }

    public class WireTraceStationInfo
    {
        public string StationName { get; set; } = string.Empty;
        public int LegCount { get; set; }
        public int ModuleCount { get; set; }
        public List<string> Modules { get; set; } = new();
    }
}
namespace DynamicWiApi.Models
{
    public class WireTraceProcessRequest
    {
        public int ModuleListId { get; set; }
        public string LjsString { get; set; } = string.Empty;
        public int CropFirst { get; set; } = 3;
        public int CropLast { get; set; } = 1;
        public int RawIdx { get; set; } = 3;
    }
}
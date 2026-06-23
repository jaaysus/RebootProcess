using System.ComponentModel.DataAnnotations;

namespace DynamicWiApi.Models
{
    public class EpnInfo
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(150)]
        public string Epn { get; set; } = string.Empty;

        [Required]
        public int CavityCount { get; set; }

        [MaxLength(500)]
        public string Photo { get; set; } = string.Empty;

        public int ImageWidth { get; set; } = 300;
        public int ImageHeight { get; set; } = 300;

        public string CoordinatesJson { get; set; } = "{\"imageWidth\":300,\"imageHeight\":300,\"cavities\":{}}";

        public bool NeedsCoordination { get; set; } = true;
    }
}

using System.ComponentModel.DataAnnotations;

namespace DynamicWiApi.Models
{
    public class ModuleList
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int LjsOrd { get; set; }

        [Required]
        [MaxLength(100)]
        public string Module { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Composite { get; set; } = string.Empty;
    }
}

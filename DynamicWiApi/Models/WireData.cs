using System.ComponentModel.DataAnnotations;

namespace DynamicWiApi.Models
{
    public class WireData
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string WireNumber { get; set; } = string.Empty;

        [Required]
        public double Csa { get; set; }

        [Required]
        public double Length { get; set; }

        [Required]
        [MaxLength(50)]
        public string C1 { get; set; } = string.Empty;

        [MaxLength(50)]
        public string C2 { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Loc { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Node { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Epn { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Cavity { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Module { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Station { get; set; } = string.Empty;

        // Harness trace fields
        public string Twist { get; set; } = string.Empty;
        public string Core { get; set; } = string.Empty;
        [MaxLength(100)]
        public string Splice { get; set; } = string.Empty;
    }
}

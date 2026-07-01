using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DynamicWiApi.Models
{
    public class ModuleListEntry
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ModuleListId { get; set; }

        [ForeignKey("ModuleListId")]
        public ModuleList ModuleList { get; set; } = null!;

        [Required]
        public string Composite { get; set; } = string.Empty;

        public int RowIndex { get; set; } 

        public int Quantity { get; set; }

        [Required]
        public string Module { get; set; } = string.Empty;

        [Required]
        public string CPN { get; set; } = string.Empty;
    }
}
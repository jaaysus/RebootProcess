using Microsoft.AspNetCore.Mvc;
using ClosedXML.Excel;

namespace DynamicWiApi.Controllers
{
    [ApiController]
    [Route("api/process")]
    public class ImprovedController : ControllerBase
    {
        [HttpPost("excel-detailed")]
        public async Task<IActionResult> ProcessExcel(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);

            using var workbook = new XLWorkbook(stream);
            var ws = workbook.Worksheets.First();
            int lastRow = ws.LastRowUsed()!.RowNumber();
            int lastCol = ws.LastColumnUsed()!.ColumnNumber();

            var results = new Dictionary<string, object>();

            for (int r = 1; r <= lastRow; r++)
            {
                for (int c = 1; c <= lastCol; c++)
                {
                    var cell = ws.Cell(r, c);
                    var text = cell.GetFormattedString().Trim();
                    if (string.IsNullOrEmpty(text)) continue;

                    
                    if (text.Contains("PRC.04.00.DI"))
                    {
                        results["code"] = new
                        {
                            position = cell.Address.ToString(),
                            value = "PRC.04.00.DI"
                        };
                    }

                    
                    if (text == "Référence de Plan" || text == "Famille" || text == "Opération")
                    {
                        if (c < lastCol)
                        {
                            var right = cell.CellRight();
                            results[text] = new
                            {
                                position = cell.Address.ToString(),
                                valueCell = right.Address.ToString(),
                                value = right.GetFormattedString()
                            };
                        }
                    }

                    
                    if (text == "INT.FAM")
                    {
                        if (r < lastRow)
                        {
                            var below = cell.CellBelow();
                            results["INT.FAM"] = new
                            {
                                position = cell.Address.ToString(),
                                valueCell = below.Address.ToString(),
                                value = below.GetFormattedString()
                            };
                        }
                    }

                    
                    if (text.Contains("Edition"))
                    {
                        results["Edition"] = new
                        {
                            position = cell.Address.ToString(),
                            value = text
                        };
                    }

                    if (text.Contains("Révision"))
                    {
                        results["Révision"] = new
                        {
                            position = cell.Address.ToString(),
                            value = text
                        };
                    }

                    
                    if (text == "Description de la caractériqtique" ||
                        text == "Classification" ||
                        text == "Symbole")
                    {
                        results[text] = new
                        {
                            position = cell.Address.ToString(),
                            value = text
                        };
                    }

                    
                    if (text == "Crée par :" ||
                        text == "Date de création:" ||
                        text == "N°" ||
                        text == "Date de Modification" ||
                        text == "Modifié Par :" ||
                        text == "Contenu de changement")
                    {
                        results[text] = new
                        {
                            position = cell.Address.ToString(),
                            value = text
                        };
                    }
                }
            }

            return Ok(results);
        }
    }
}
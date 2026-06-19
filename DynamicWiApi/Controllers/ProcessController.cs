using Microsoft.AspNetCore.Mvc;
using ClosedXML.Excel;
namespace DynamicWiApi.Controllers
{
    [ApiController]
    [Route("process")]
    public class ProcessController : ControllerBase
    {
        [HttpPost("excel")]
        public async Task<IActionResult> ProcessExcel(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);

            using var workbook = new XLWorkbook(stream);
            var ws = workbook.Worksheets.First();

            int startColumn = 4; 
            int headerRow = 1;

            var headers = new Dictionary<int, string>();

            
            foreach (var cell in ws.Row(headerRow).CellsUsed())
            {
                if (cell.Address.ColumnNumber < startColumn) continue;

                var header = cell.GetFormattedString().Trim();
                if (!string.IsNullOrEmpty(header))
                    headers[cell.Address.ColumnNumber] = header;
            }

            if (!headers.Any())
                return BadRequest("No headers found starting from D1.");

            var result = new Dictionary<string, List<Dictionary<string, object>>>();

            string currentStation = null!;

            int lastRow = ws.LastRowUsed()!.RowNumber();

            for (int r = headerRow + 1; r <= lastRow; r++)
            {
                var row = ws.Row(r);

                if (!row.CellsUsed().Any())
                    continue;

                var rowData = new Dictionary<string, string>();

                foreach (var kv in headers)
                {
                    var cell = row.Cell(kv.Key);
                    rowData[kv.Value] = cell.GetFormattedString().Trim();
                }

                
                if (rowData.TryGetValue("STATION", out var stationVal))
                {
                    if (!string.IsNullOrWhiteSpace(stationVal))
                        currentStation = stationVal.Trim();
                }

                if (string.IsNullOrEmpty(currentStation))
                    continue; 

                if (!result.ContainsKey(currentStation))
                    result[currentStation] = new List<Dictionary<string, object>>();

                
                if (string.IsNullOrWhiteSpace(rowData.GetValueOrDefault("Description")) &&
                    string.IsNullOrWhiteSpace(rowData.GetValueOrDefault("Extra")))
                    continue;

                var instructionObj = new Dictionary<string, object>();

                foreach (var kv in rowData)
                {
                    if (!string.IsNullOrWhiteSpace(kv.Value))
                        instructionObj[kv.Key.ToLower().Replace(" ", "")] = kv.Value;
                }

                result[currentStation].Add(instructionObj);
            }

            return Ok(result);
        }
    }
}

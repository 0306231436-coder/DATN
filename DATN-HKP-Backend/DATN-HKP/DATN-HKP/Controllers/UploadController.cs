using Microsoft.AspNetCore.Mvc;

namespace DATN_HKP.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UploadController : ControllerBase
    {
        private readonly IWebHostEnvironment _environment;

        public UploadController(IWebHostEnvironment environment)
        {
            _environment = environment;
        }

        // POST: api/Upload/images
        [HttpPost("images")]
        public async Task<IActionResult> UploadImages([FromForm] List<IFormFile> files)
        {
            if (files == null || files.Count == 0)
            {
                return BadRequest(new { message = "Không có file nào được chọn." });
            }

            var wwwRootPath = _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var uploadFolder = Path.Combine(wwwRootPath, "uploads", "products");

            if (!Directory.Exists(uploadFolder))
            {
                Directory.CreateDirectory(uploadFolder);
            }

            var uploadedUrls = new List<string>();

            foreach (var file in files)
            {
                if (file.Length > 0)
                {
                    var extension = Path.GetExtension(file.FileName);
                    var uniqueFileName = $"{Guid.NewGuid()}{extension}";
                    var filePath = Path.Combine(uploadFolder, uniqueFileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    var relativePath = $"/uploads/products/{uniqueFileName}";
                    uploadedUrls.Add(relativePath);
                }
            }

            return Ok(new { urls = uploadedUrls });
        }
    }
}
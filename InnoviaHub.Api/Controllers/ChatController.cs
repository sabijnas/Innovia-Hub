using System.Text;
using System.Text.Json;
using InnoviaHub.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InnoviaHub.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IAvailabilityService _availabilityService;

        public ChatController(
            IHttpClientFactory httpClientFactory,
            IAvailabilityService availabilityService)
        {
            _httpClientFactory = httpClientFactory;
            _availabilityService = availabilityService;
        }

        public record ChatRequest(string question, DateTime StartTime, DateTime EndTime, Guid? ResourceTypeId);

        [HttpPost]
        public async Task<IActionResult> Chat([FromBody] ChatRequest request)
        {
            if (request.StartTime >= request.EndTime)
            {
                return BadRequest("Starttiden måste vara före sluttiden");
            }

            var availableResources = 
            await _availabilityService.FindAvailableAsync(request.StartTime, request.EndTime, request.ResourceTypeId);
            var availabilityJson = JsonSerializer.Serialize(availableResources);

            var http = _httpClientFactory.CreateClient("openai");

            var body = new
            {
                model = "gpt-6-astra",
                
                input = new object[]
                {
                    new
                    {
                        role = "system",
                        content = $"Du är en AI-assistent på Innovia Hub " + $"Svara utifrån dessa lediga resurser: {availabilityJson}"
                    },
                    new
                    {
                        role = "user",
                        content = request.question
                    }
                }
            };

            var content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");
            var response = await http.PostAsync("responses", content);
            var raw = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                return BadRequest("Något gick fel, försök igen senare");
            }

            var doc = JsonDocument.Parse(raw);
            var root = doc.RootElement;

            string reply = root
                .GetProperty("output")
                .EnumerateArray()
                .SelectMany(output => output.GetProperty("content").EnumerateArray())
                .Where(content => content.TryGetProperty("text", out _))
                .Select(content => content.GetProperty("text").GetString())
                .FirstOrDefault(text => !string.IsNullOrEmpty(text))
                ?? "Inget svar";

            return Ok(reply);
        }
    }
}

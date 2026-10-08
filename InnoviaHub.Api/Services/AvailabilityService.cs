using InnoviaHub.Api.Mappings;
using InnoviaHub.Api.Services.Interfaces;
using InnoviaHub.DataAccess.Repositories.Interfaces;
using InnoviaHub.Shared.DTOs.Resource;

namespace InnoviaHub.Api.Services;

public class AvailabilityService(
    IResourceRepository resourceRepository,
    IBookingRepository bookingRepository) : IAvailabilityService
{

    public async Task<IEnumerable<ResourceDto>> FindAvailableAsync(
        DateTime startTime,
        DateTime endTime,
        Guid? resourceTypeId = null)
    {
        if (startTime >= endTime)
            throw new ArgumentException("Starttiden måste vara före sluttiden.");

        var resources = await resourceRepository.GetAllAsync();
        var bookings = await bookingRepository.GetAllAsync();

        return resources
            .Where(resource =>
                resource.IsActive &&
                (!resourceTypeId.HasValue || resource.ResourceTypeId == resourceTypeId.Value) &&
                bookings.All(booking =>
                    booking.ResourceId != resource.Id ||
                    booking.IsCancelled ||
                    booking.StartTime >= endTime ||
                    booking.EndTime <= startTime))
            .Select(resource => resource.ToDto())
            .ToList();
    }
}
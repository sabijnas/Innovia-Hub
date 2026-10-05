using System;
using InnoviaHub.Shared.DTOs.Resource;

namespace InnoviaHub.Api.Services.Interfaces;

public interface IAvailabilityService
{
    Task<IEnumerable<ResourceDto>> FindAvailableAsync(
        DateTime startTime,
        DateTime endTime,
        Guid? resourceTypeId = null
    );
}

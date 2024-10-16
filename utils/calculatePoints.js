function calculatePoints(hours, serviceType) {
    const pointsTable = {
      "Extension Services": [
        { range: [7, 16.99], points: 1.5 },
        { range: [17, 48.99], points: 3 },
        { range: [49, 64.99], points: 4.5 },
        { range: [65, 77.99], points: 6 },
        { range: [78, Infinity], points: 7.5 }
      ],
      "College Driven": [
        { range: [7, 16.99], points: 3.5 },
        { range: [17, 48.99], points: 7 },
        { range: [49, 64.99], points: 10.5 },
        { range: [65, 77.99], points: 14 },
        { range: [78, Infinity], points: 18 }
      ],
      "Institutional": [
        { range: [7, 16.99], points: 3.5 },
        { range: [17, 48.99], points: 7 },
        { range: [49, 64.99], points: 10.5 },
        { range: [65, 77.99], points: 14 },
        { range: [78, Infinity], points: 18 }
      ],
      "Capacity Building ": [
        { range: [7, 16.99], points: 2 },
        { range: [17, 48.99], points: 4 },
        { range: [49, 64.99], points: 6 },
        { range: [65, 77.99], points: 8 },
        { range: [78, Infinity], points: 10 }
      ]
    };
  
    // Validate service type
    if (!pointsTable[serviceType]) {
      throw new Error("Invalid service type");
    }
  
    // Find the matching range and return the points
    const ranges = pointsTable[serviceType];
    for (let i = 0; i < ranges.length; i++) {
      const { range, points } = ranges[i];
      if (hours >= range[0] && hours <= range[1]) {
        return points;
      }
    }
  
    return 0; // Default in case no range matches
  }
  
  // Example usage:
  const totalHours = 8 + 12; // 20 hours
  const serviceType = "Institutional";
  const points = calculatePoints(totalHours, serviceType);
  
  console.log(`Your equivalent points: ${points}`); // Output: Your equivalent points: 7
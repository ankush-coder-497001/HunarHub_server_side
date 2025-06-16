const fetch = require('node-fetch');
const workerModel = require('../models/worker.model');
const FindAreaByPhoton = async (lat, lon) => {
  try {
    const photonRes = await fetch(`https://photon.komoot.io/api/?q=area&lat=${lat}&lon=${lon}&limit=50`);
    const { features } = await photonRes.json();
    return features;
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    throw error.message;
  }
}

const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


const SetWorkersServiceArea = async (workerId, lat, lon, radiusKm) => {
  try {
    if (!workerId || !lat || !lon || !radiusKm) {
      throw new Error("Worker ID, latitude, longitude, and radius are required.");
    }

    const features = await FindAreaByPhoton(lat, lon);
    console.log("Fetched Features:", features);
    const areas = features
      .map((f) => {
        const [lng, lt] = f.geometry.coordinates;
        const distance = getDistanceFromLatLonInKm(lat, lon, lt, lng);
        return {
          name: f.properties.name || "Unknown Area",
          coordinates: [lng, lt],
          distance
        }
      })
      .filter((f) => f.name && f.distance <= radiusKm)
    //remove duplicates
    const seen = new Set()
    const uniqueAreas = areas.filter((a) => {
      const key = a.name + a.coordinates.join(',');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })

    const formatted = uniqueAreas.map((are) => ({
      name: are.name,
      location: {
        type: "Point",
        coordinates: are.coordinates
      }
    }))

    const updatedWorker = await workerModel.findOneAndUpdate(
      { user: workerId },
      { $set: { ServiceAreas: formatted } },
      { new: true }
    );

    if (!updatedWorker) {
      throw new Error("Worker not found");
    }

    return updatedWorker.ServiceAreas;

  } catch (error) {
    console.error("Error setting workers service area:", error);
    throw error.message;
  }
}

module.exports = {
  SetWorkersServiceArea,
  FindAreaByPhoton,
  getDistanceFromLatLonInKm
}
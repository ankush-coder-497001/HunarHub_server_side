const ServiceModel = require('../models/service.model')
const WorkerModel = require('../models/worker.model');
const ServiceController = {
  getAllServices: async (req, res) => {
    try {
      const services = await ServiceModel.find();
      if (!services || services.length === 0) {
        return res.status(404).json({ message: "No services found" });
      }
      res.status(200).json({ services });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },
  addNewService: async (req, res) => {
    try {
      const { name, iconUrl } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Service name is required" });
      }
      const service = await ServiceModel.create({
        name,
        iconUrl: iconUrl || "https://res.cloudinary.com/dz1q3xj5h/image/upload/v1735688850/LocalBliz/default_service_icon.png"
      });
      if (!service) {
        return res.status(400).json({ message: "Service not created" });
      }
      res.status(201).json({ message: "Service created successfully", service });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },
  updateService: async (req, res) => {
    try {
      const { id } = req.params;
      const service = await ServiceModel.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true }
      )
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.status(200).json({ message: "Service updated successfully", service });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },
  deleteService: async (req, res) => {
    try {
      const { id } = req.params;
      const service = await ServiceModel.findByIdAndDelete(id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.status(200).json({ message: "Service deleted successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },
  getServiceByWorkerId: async (req, res) => {
    try {
      const { workerId } = req.params;
      if (!workerId) {
        return res.status(400).json({ message: "Worker ID is required" });
      }
      const worker = await WorkerModel.findById(workerId).populate('services');
      if (!worker) {
        return res.status(404).json({ message: "Worker not found" });
      }
      if (!worker.services || worker.services.length === 0) {
        return res.status(404).json({ message: "No services found for this worker" });
      }
      res.status(200).json({ services: worker.services });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = ServiceController;
const { Router } = require("express");

const { 
    processMessageValidator
 } = require("../validators/messageProcessing.validators.js");
const handleValidationErrors = require("../middlewares/handleValidation.middleware.js");
const MessageProcessingController = require("../controllers/messageProcessing.controller.js");

const router = Router();

router.post("/message", 
    processMessageValidator, 
    handleValidationErrors, 
    MessageProcessingController.processMessage
);



module.exports = router;
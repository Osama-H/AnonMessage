const events = require("events");
const Audit = require("./../models/auditModel");

const emitter = new events.EventEmitter();

emitter.on("audit", async (audit) => {
  await Audit.create(audit);
  console.log("Audit log created successfully.");
});

exports.prepareAudit = (auditAction, data, error, auditBy, auditOn) => {
  let status = 200;
  if (error) status = 500;

  if (typeof data === "object" && data !== null) {
    data = JSON.stringify(data);
  }

  const auditObj = {
    auditAction,
    data,
    status,
    error,
    auditBy,
    auditOn,
  };
  emitter.emit("audit", auditObj);
};

// This is With transacation

// const events = require("events");
// const auditModel = require("../models/auditModel");

// const emitter = new events.EventEmitter();

// emitter.on("audit", async (audit, transaction) => {
//   try {
//     await Audit.create(audit, { transaction });
//     console.log("Audit log created successfully.");
//   } catch (error) {
//     console.error("Error creating audit log:", error);
//     // Handle or log the error as necessary
//   }
// });

// exports.prepareAudit = async (
//   auditAction,
//   data,
//   error,
//   auditBy,
//   auditOn,
//   transaction
// ) => {
//   let status = 200;
//   if (error) status = 500;

//   if (typeof data === "object" && data !== null) {
//     data = JSON.stringify(data);
//   }

//   const auditObj = {
//     auditAction,
//     data,
//     status,
//     error,
//     auditBy,
//     auditOn,
//   };

//   await emitter.emit("audit", auditObj, transaction);
// };

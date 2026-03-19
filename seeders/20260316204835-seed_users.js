"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("users", [
      {
        id: 1,
        tenant_id: 1,
        name: "nahuel",
        email: "nahuel@local.com",
        password: "$2b$10$yBDAOIkTK3rm8Lby3GITiegI6cy7AhZvvj8bF41tI2pWBHBaA9QA6",
        is_admin: false,
        is_email_verified: false,
        avatar_filename: null,
        primary_position: null,
        secondary_position: null,
        created_at: "2025-12-08 21:50:26",
        updated_at: "2025-12-08 21:50:26",
        deleted_at: null,
      },
      {
        id: 2,
        tenant_id: 1,
        name: "Nahuel mellusso",
        email: "nahuelmellusso@gmail.com",
        password: "$2b$10$9m.r0qbGc3UlzSWioGyoZOaNHF025Apt91BS9xxp05NRCCbIHK.A2",
        is_admin: false,
        is_email_verified: false,
        avatar_filename: null,
        primary_position: null,
        secondary_position: null,
        created_at: "2025-12-17 22:46:27",
        updated_at: "2026-01-08 14:01:04",
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("users", {
      id: [1, 2],
    });
  },
};

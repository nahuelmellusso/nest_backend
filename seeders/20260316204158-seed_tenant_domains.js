"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("tenant_domains", [
      {
        id: 1,
        tenant_id: 1,
        host: "main.localhost",
        type: "system_subdomain",
        is_primary: true,
        is_verified: true,
        verification_token: null,
        verified_at: new Date(),
        status: "active",
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        id: 2,
        tenant_id: 2,
        host: "demo.localhost",
        type: "system_subdomain",
        is_primary: true,
        is_verified: true,
        verification_token: null,
        verified_at: new Date(),
        status: "active",
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("tenant_domains", {
      id: [1, 2],
    });
  },
};

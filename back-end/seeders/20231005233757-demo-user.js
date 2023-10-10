'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Users', [{
      userName: 'JohnDoe',
      password: 'example',
      email: 'example@example.com',
      createdAt: new Date(),
      updatedAt: new Date()
    }]);

  },

  async down (queryInterface, Sequelize) {

    await queryInterface.bulkDelete('Users', null, {})

  }
};

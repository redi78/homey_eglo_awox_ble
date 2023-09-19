'use strict';

const Homey = require('homey');

class Eglo_AwoXApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('Eglo/AwoX app has been initialized');
  }

}

module.exports = Eglo_AwoXApp;

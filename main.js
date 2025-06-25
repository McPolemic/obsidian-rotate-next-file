const { Plugin, Notice, PluginSettingTab, Setting } = require('obsidian');

const DEFAULT_SETTINGS = {
  nextFolder: 'Next',
  destinationFolder: 'Daily Notes'
};

module.exports = class RotateNextFilePlugin extends Plugin {
  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

    this.addCommand({
      id: 'rotate-next-file',
      name: 'Rotate File',
      callback: async () => {
        const file = this.app.workspace.getActiveFile();
        if (!file) {
          new Notice('No active file to rotate.');
          return;
        }
        const filePath = file.path;
        if (!filePath.startsWith(`${this.settings.nextFolder}/`)) {
          new Notice(`File not in folder: ${this.settings.nextFolder}`);
          return;
        }
        const basename = file.basename;
        const match = basename.match(/^Next (.+) Appointment$/);
        if (!match) {
          new Notice('Filename must match `Next {Appointment Type} Appointment`.');
          return;
        }
        const appointmentType = match[1];
        const isoDate = new Date().toISOString().split('T')[0];
        const newName = `${this.settings.destinationFolder}/${isoDate} ${appointmentType} Appointment.md`;

        try {
          await this.app.vault.rename(file, newName);
          const templatePath = `${this.settings.nextFolder}/Next ${appointmentType} Appointment.md`;
          const newFile = await this.app.vault.create(templatePath, '');
          await this.app.workspace.getLeaf().openFile(newFile);
        } catch (error) {
          new Notice(`Error rotating file: ${error}`);
        }
      }
    });

    this.addSettingTab(new RotateNextFileSettingTab(this.app, this));
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
};

class RotateNextFileSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'Rotate Next File Settings' });

    new Setting(containerEl)
      .setName('Next Folder')
      .setDesc('Source folder for "Next" appointment files')
      .addText(text =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.nextFolder)
          .setValue(this.plugin.settings.nextFolder)
          .onChange(async (value) => {
            this.plugin.settings.nextFolder = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Destination Folder')
      .setDesc('Folder where rotated files are moved')
      .addText(text =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.destinationFolder)
          .setValue(this.plugin.settings.destinationFolder)
          .onChange(async (value) => {
            this.plugin.settings.destinationFolder = value.trim();
            await this.plugin.saveSettings();
          })
      );
  }
}

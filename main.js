const { Plugin, Notice, PluginSettingTab, Setting, FuzzySuggestModal } = require('obsidian');

const DEFAULT_SETTINGS = {
  nextFolder: 'Next',
  destinationFolder: 'Daily Notes'
};

class FilePickerModal extends FuzzySuggestModal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
  }

  getItems() {
    const files = this.app.vault.getMarkdownFiles();
    return files.filter(file => file.path.startsWith(`${this.plugin.settings.nextFolder}/`));
  }

  getItemText(file) {
    return file.basename;
  }

  onChooseItem(file) {
    this.plugin.rotateFile(file);
  }
}

module.exports = class RotateNextFilePlugin extends Plugin {
  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

    this.addCommand({
      id: 'rotate-next-file',
      name: 'Rotate File',
      callback: () => {
        new FilePickerModal(this.app, this).open();
      }
    });

    this.registerObsidianProtocolHandler('rotate-next-file', async (params) => {
      if (params.file) {
        const files = this.app.vault.getMarkdownFiles();
        const file = files.find(f =>
          f.path === `${this.settings.nextFolder}/${params.file}` ||
          f.path === `${this.settings.nextFolder}/${params.file}.md` ||
          f.basename === params.file
        );

        if (file) {
          await this.rotateFile(file);
        } else {
          new Notice(`File not found: ${params.file}`);
        }
      } else {
        new FilePickerModal(this.app, this).open();
      }
    });

    this.addSettingTab(new RotateNextFileSettingTab(this.app, this));
  }

  async rotateFile(file) {
    const basename = file.basename;
    const match = basename.match(/^Next (.+)$/);
    if (!match) {
      new Notice('Filename must match `Next {Appointment Type}`.');
      return;
    }
    const appointmentType = match[1];
    const isoDate = new Date().toISOString().split('T')[0];
    const newName = `${this.settings.destinationFolder}/${isoDate} ${appointmentType}.md`;

    try {
      await this.app.vault.rename(file, newName);
      const templatePath = `${this.settings.nextFolder}/Next ${appointmentType}.md`;
      const newFile = await this.app.vault.create(templatePath, '');
      await this.app.workspace.getLeaf().openFile(newFile);
      new Notice(`Rotated to ${newName}`);
    } catch (error) {
      new Notice(`Error rotating file: ${error}`);
    }
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

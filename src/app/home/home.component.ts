
import { Component, OnInit, NgZone } from '@angular/core';
import { ElectronService } from '../core/services/electron/electron.service';
import * as XLSX from 'xlsx';

type AOA = any[][];

/**
 *  Home Component
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  public fileName = '';
  public prefix = '';
  public nbrLang = 0;
  public nbrTradKey = 0;
  fileUploaded = false;
  fileIsCreate = false;
  activatedDepth = true;

  xlsxObject: any = {};
  xlsFileData: any = {};
  private data: AOA = [[1, 2], [3, 4]];
  private wopts: XLSX.WritingOptions = { bookType: 'xlsx', type: 'array' };

  /**
   * Creates an instance of HomeComponent.
   */
  constructor(public electronService: ElectronService, public zone: NgZone) { }

  ngOnInit() { }

  /**
   * Reading the xls file
   */
  onFileChange(evt: any) {
    /* wire up file reader */
    const target: DataTransfer = <DataTransfer>(evt.target);
    if (target.files.length !== 1) {
      throw new Error('Cannot use multiple files');
    };
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {

      /* read workbook */
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });

      /* grab first sheet */
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      /* save data */
      this.data = <AOA>(XLSX.utils.sheet_to_json(ws, { header: 1 }));

      this.xlsFileData = this.data;
      this.xlsxObject = this.formatLang(this.xlsFileData);
      this.fileName = evt.target.value;
      this.fileUploaded = true;
      this.fileIsCreate = false;
      this.nbrLang = this.xlsxObject.nbrLang;
      this.nbrTradKey = this.xlsxObject.nbrTradKey;

    };
    reader.readAsBinaryString(target.files[0]);
  }

  /**
   * Management of depth activation / deactivation
   */
  public activateDepth() {
    this.activatedDepth = !this.activatedDepth;
    this.xlsxObject = this.formatLang(this.xlsFileData);
    this.nbrLang = this.xlsxObject.nbrLang;
    this.nbrTradKey = this.xlsxObject.nbrTradKey;
    this.fileIsCreate = false;
  }

  /**
   * Formatting language data
   */
  formatLang(dataLangs: any) {

    //  Cr??ation des objects pour chaque langues
    const objLangs = {};
    for (let i = (this.activatedDepth) ? 2 : 1; i < dataLangs[0].length; i++) {
      objLangs[i] = {};
    }

    //  Boucle sur les cl??s
    for (let i = 1; i < dataLangs.length; i++) {
      let keyTrad = dataLangs[i][0];
      if (keyTrad !== undefined) {

        keyTrad = keyTrad.replace(/\s/g, '');  //  Replace espace
        keyTrad = keyTrad.toUpperCase();  //  UpperCase

        if (this.activatedDepth) {
          for (let x = 2; x < dataLangs[0].length; x++) {
            if (typeof objLangs[x][dataLangs[i][1]] === 'object') {
              objLangs[x][dataLangs[i][1]][keyTrad] = dataLangs[i][x];
            } else {
              objLangs[x][dataLangs[i][1]] = {};
              objLangs[x][dataLangs[i][1]][keyTrad] = dataLangs[i][x];
            }
          }
        } else {
          for (let x = 1; x < dataLangs[0].length; x++) {
            objLangs[x][keyTrad] = dataLangs[i][x];
          }
        }

      }
    }

    //  Liaison des cl??s de traduction avec leurs code ISO
    const finalLangObj = {};
    for (let i = (this.activatedDepth) ? 2 : 1; i < dataLangs[0].length; i++) {
      finalLangObj[dataLangs[0][i]] = objLangs[i];
    }

    return {
      nbrLang: dataLangs[0].length - ((this.activatedDepth) ? 2 : 1),
      nbrTradKey: dataLangs.length - 1,
      data: finalLangObj
    };
  }

  /**
   * Ouverure de la fen??tre "choose directory" + cr??ation des fichiers json
   */
  public createJsonFile() {
    const xlsxObject = this.formatLang(this.xlsFileData);
    console.log('xlsxObject', xlsxObject);

    // create dialog for choose a directory to save files
    const dialogOptions = {
      title: 'Choose a folder:',
      properties: ['openDirectory', 'promptToCreate'],
    };
    this.electronService.remote.dialog.showOpenDialog(
      dialogOptions
    ).then((data) => {
      if (data.canceled === false) {
        const path: string = data.filePaths[0];
        console.log('FullPath : ' + path);

        if (path) {
          // create .json files
          for (const index in xlsxObject.data) {
            if (Object.prototype.hasOwnProperty.call(xlsxObject.data, index)) {

              const jsonData = JSON.stringify(xlsxObject.data[index]);
              const fileName = this.prefix + index + '.json';
              const fullPath = path + '/';

              console.log(fullPath + fileName);
              this.electronService.fs.writeFile(fullPath + fileName, jsonData, { encoding: 'utf8' }, (): void => {
                console.log('create json file : Ok');
                this.zone.run(() => {
                  this.fileIsCreate = true;
                });
              });
            }
          }

        }

      }
    }).catch(err => console.log('Handle Error', err));
  }

}

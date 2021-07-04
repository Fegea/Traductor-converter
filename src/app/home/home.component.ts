
import { Component, OnInit, NgZone } from '@angular/core';
import { ElectronService } from '../providers/electron.service';

import * as XLSX from 'xlsx';

type AOA = any[][];

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(public electronService: ElectronService, public zone: NgZone) {
  }

  ngOnInit() {
  }

  data: AOA = [[1, 2], [3, 4]];
  wopts: XLSX.WritingOptions = { bookType: 'xlsx', type: 'array' };
  fileName: string = "";
  prefix: string = "language-";
  nbrLang: Number = 0;
  nbrTradKey: Number = 0;
  fileUploaded: Boolean = false;
  fileIsCreate: Boolean = false;
  activatedDepth: Boolean = true;

  xlsxObject: any = {};
  xlsFileData: any = {};

  //
  //  Lecture du fichier xls
  //
  onFileChange(evt: any) {
    /* wire up file reader */
    const target: DataTransfer = <DataTransfer>(evt.target);
    if (target.files.length !== 1) throw new Error('Cannot use multiple files');
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

  //
  // Gestion de l'activation/désactivation de la profondeur
  //
  public activateDepth() {
    this.activatedDepth = !this.activatedDepth;
    this.xlsxObject = this.formatLang(this.xlsFileData);
    this.nbrLang = this.xlsxObject.nbrLang;
    this.nbrTradKey = this.xlsxObject.nbrTradKey;
    this.fileIsCreate = false;
  }

  //
  //  Formatage des données des langues
  //
  formatLang(dataLangs: any) {

    //  Création des objects pour chaque langues
    var objLangs = {};
    for (var i = (this.activatedDepth) ? 2 : 1; i < dataLangs[0].length; i++) {
      objLangs[i] = {};
    }

    //  Boucle sur les clés
    for (var i = 1; i < dataLangs.length; i++) {
      var keyTrad = dataLangs[i][0];
      if (keyTrad !== undefined) {

        keyTrad = keyTrad.replace(/\s/g, "");  //  Replace espace
        keyTrad = keyTrad.toUpperCase();  //  UpperCase

        if (this.activatedDepth) {
          for (var x = 2; x < dataLangs[0].length; x++) {
            if (typeof objLangs[x][dataLangs[i][1]] === 'object') {
              objLangs[x][dataLangs[i][1]][keyTrad] = dataLangs[i][x];
            } else {
              objLangs[x][dataLangs[i][1]] = {}
              objLangs[x][dataLangs[i][1]][keyTrad] = dataLangs[i][x];
            }
          }
        } else {
          for (var x = 1; x < dataLangs[0].length; x++) {
            objLangs[x][keyTrad] = dataLangs[i][x];
          }
        }

      }
    }

    //  Liaison des clés de traduction avec leurs code ISO
    var finalLangObj = {};
    for (var i = (this.activatedDepth) ? 2 : 1; i < dataLangs[0].length; i++) {
      finalLangObj[dataLangs[0][i]] = objLangs[i];
    }

    return {
      nbrLang: dataLangs[0].length - ((this.activatedDepth) ? 2 : 1),
      nbrTradKey: dataLangs.length - 1,
      data: finalLangObj
    };
  }

  //
  //  Ouverure de la fenêtre "choose directory" + création des fichiers json
  //
  createJsonFile() {

    // var xlsxObject = this.formatLang(this.xlsFileData)

    // // create dialog for choose a directory to save files
    // this.electronService.remote.dialog.showOpenDialog(null, {
    //   properties: ['openDirectory']
    // }, (path): void => {
    //   console.log("FullPath : " + path);
    //   if (path) {
    //     console.log(xlsxObject);
    //     // create .json files
    //     for (var index in xlsxObject.data) {
    //       var jsonData = JSON.stringify(xlsxObject.data[index]),
    //         fileName = this.prefix + index + ".json",
    //         fullPath = path[0] + "/";
    //       this.electronService.fs.writeFile(fullPath + fileName, jsonData, { encoding: "utf8" }, (): void => {
    //         console.log("create json file : Ok");
    //         this.zone.run(() => {
    //           this.fileIsCreate = true;
    //         });
    //       });
    //     }
    //   }
    // });

  }



}

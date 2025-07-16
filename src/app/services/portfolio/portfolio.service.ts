import { Injectable, OnInit } from '@angular/core';
import { TranslateManagerService } from '../../services/translate/translate-manager.service';



@Injectable({
  providedIn: 'root'
})
export class PortfolioService implements OnInit {
  activeLanguage: string = 'de';

  constructor(private translateManager: TranslateManagerService) {

  }

  ngOnInit(): void {
    this.translateManager.activeLanguage$.subscribe(lang => {
      this.activeLanguage = lang;
    });
  }

  projectBox = [

    {
      "id": "join",
      "title": "Join",
      "img": '../../../assets/img/portfolio/JOIN.png',
      "technologies": ["Angular", "TypeScript", "HTML", "CSS", "Firebase"],
      "description": "PORTFOLIO.PROJECTS.JOIN_DESCRIPTION",
      "liveTestUrl": "https://projekte.joergbechtold.com/join",
      "githubUrl": "https://github.com/JoergBechtold/Join.git"
    },

    {
      "id": "el-pollo-loco",
      "title": "El Pollo Loco",
      "img": '../../../assets/img/portfolio/POLLO_LOCO.png',
      "technologies": ["JavaScript", "HTML", "CSS"],
      "description": "PORTFOLIO.PROJECTS.EL_POLLO_LOCO_DESCRIPTION",
      "liveTestUrl": "https://projekte.joergbechtold.com/el-pollo-loco",
      "githubUrl": "https://github.com/JoergBechtold/El-Pollo-Loco.git"
    },

    // {
    //   "id": "da-bubble",
    //   "title": "DA Bubble",
    //   "img": '../../../assets/img/portfolio/DA_BUBBLE.png',
    //   "technologies": ["Angular", "TypeScript", "Firebase"],
    //   "description": "PORTFOLIO.PROJECTS.DA_BUBBLE_DESCRIPTION",
    //   "liveTestUrl": "",
    //   "githubUrl": ""
    // },
  ]
}

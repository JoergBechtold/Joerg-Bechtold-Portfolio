import { Injectable, OnInit } from '@angular/core';
import { TranslateManagerService } from '../../services/translate/translate-manager.service';

export interface Project {
  id: string;
  title: string;
  img: string;
  imgAlt: string;
  technologies: string[];
  description: string;
  liveTestUrl: string;
  githubUrl: string;
}

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

  projectBox: Project[] = [

    {
      "id": "join",
      "title": "Join",
      "img": '../../../assets/img/portfolio/JOIN.png',
      "imgAlt": 'PORTFOLIO.ALT_TEXT.JOIN_ALT',
      "technologies": ["Angular", "TypeScript", "HTML", "CSS", "Firebase"],
      "description": "PORTFOLIO.PROJECTS.JOIN_DESCRIPTION",
      "liveTestUrl": "https://projekte.joergbechtold.com/join",
      "githubUrl": "https://github.com/JoergBechtold/Join.git"
    },

    {
      "id": "el-pollo-loco",
      "title": "El Pollo Loco",
      "img": '../../../assets/img/portfolio/POLLO_LOCO.png',
      "imgAlt": 'PORTFOLIO.ALT_TEXT.EL_POLLO_LOCO_ALT',
      "technologies": ["JavaScript", "HTML", "CSS"],
      "description": "PORTFOLIO.PROJECTS.EL_POLLO_LOCO_DESCRIPTION",
      "liveTestUrl": "https://projekte.joergbechtold.com/el-pollo-loco",
      "githubUrl": "https://github.com/JoergBechtold/El-Pollo-Loco.git"
    },

    {
      "id": "da-bubble",
      "title": "DA Bubble",
      "img": '../../../assets/img/portfolio/DA_BUBBLE.png',
      "imgAlt": 'PORTFOLIO.ALT_TEXT.DA_BUBBLE_ALT',
      "technologies": ["Angular", "TypeScript", "Firebase"],
      "description": "PORTFOLIO.PROJECTS.DA_BUBBLE_DESCRIPTION",
      "liveTestUrl": "",
      "githubUrl": ""
    },
  ]
}

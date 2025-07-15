import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {

  constructor() { }

  projectBox = [

    {
      "id": "join",
      "title": "Join",
      "img": '../../../assets/img/portfolio/JOIN.png',
      "technologies": ["Angular", "TypeScript", "HTML", "CSS", "Firebase"],
      "description": "Task manager inspired by the Kanban System. Create and organize tasks using drag and drop functions, assign users and categories.",
      "liveTestUrl": "https://projekte.joergbechtold.com/join",
      "githubUrl": "https://github.com/JoergBechtold/Join.git"
    },

    {
      "id": "el-pollo-loco",
      "title": "El Pollo Loco",
      "img": '../../../assets/img/portfolio/POLLO_LOCO.png',
      "technologies": ["JavaScript", "HTML", "CSS"],
      "description": "Jump, run and throw game based on object-oriented approach. Help Pepe to find coins and tabasco salsa to fight against the crazy hen.",
      "liveTestUrl": "https://projekte.joergbechtold.com/el-pollo-loco",
      "githubUrl": "https://github.com/JoergBechtold/El-Pollo-Loco.git"
    },

    // {
    //   "id": "da-bubble",
    //   "title": "DA Bubble",
    //   "img": '../../../assets/img/portfolio/DA_BUBBLE.png',
    //   "technologies": ["Angular", "TypeScript", "Firebase"],
    //   "description": "This App is a Slack Clone App. It revolutionizes team communication and collaboration with its intuitive interface, real-time messaging, and robust channel organization.",
    //   "liveTestUrl": "",
    //   "githubUrl": ""
    // },
  ]
}

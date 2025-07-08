import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SkillsdataService {

  constructor() { }

  skillsBox = [
    {
      name: 'HTML',
      img: './../../../assets/icons/skills-icons/HTML-icon.svg',
    },

    {
      name: 'CSS',
      img: './../../../assets/icons/skills-icons/CSS-icon.svg',
    },

    {
      name: 'JavaScript',
      img: './../../../assets/icons/skills-icons/JAVASCRIPT-icon.svg',
    },
    {
      name: 'TypeScript',
      img: './../../../assets/icons/skills-icons/TYPESCRIPT-icon.svg',
    },
    {
      name: 'ANGULAR',
      img: './../../../assets/icons/skills-icons/ANGULAR-icon.svg',
    },
    {
      name: 'Firebase',
      img: './../../../assets/icons/skills-icons/FIREBASE-icon.svg',
    },
    {
      name: 'Git',
      img: './../../../assets/icons/skills-icons/GIT-icon.svg',
    },
    {
      name: 'REST-API',
      img: './../../../assets/icons/skills-icons/API-icon.svg',
    },
    {
      name: 'Scrum',
      img: './../../../assets/icons/skills-icons/SCRUM-icon.svg',
    },
    {
      name: 'Material Design',
      img: './../../../assets/icons/skills-icons/MATERIAL-DESIGN-icon.svg',
    }
  ]
}

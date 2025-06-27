import { Component } from '@angular/core';
import { AboutMeComponent } from '../components-sections/about-me/about-me.component';
import { MySkillsComponent } from '../components-sections/my-skills/my-skills.component';
import { PortfolioComponent } from '../components-sections/portfolio/portfolio.component';
import { AtfComponent } from "../atf/atf.component";


@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [AboutMeComponent, MySkillsComponent, PortfolioComponent, AtfComponent],
  templateUrl: './main-content.component.html',
  styleUrl: './main-content.component.scss'
})
export class MainContentComponent {

}

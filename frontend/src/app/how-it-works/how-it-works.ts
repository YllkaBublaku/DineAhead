import { Component } from '@angular/core';
import {RouterLink} from '@angular/router';
import {Header} from '../header/header';
import {Footer} from '../footer/footer';

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [RouterLink, Header, Footer],
  templateUrl: './how-it-works.html',
  styleUrl: './how-it-works.css',
})
export class HowItWorks {}

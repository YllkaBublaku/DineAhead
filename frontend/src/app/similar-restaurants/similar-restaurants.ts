import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {Footer} from '../footer/footer';

@Component({
  selector: 'app-similar-restaurants',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, Footer],
  templateUrl: './similar-restaurants.html',
  styleUrl: './similar-restaurants.css'
})
export class SimilarRestaurants {
  searchDate = '';
  searchTime = '';
  searchPersons = '';

  restaurants = [
    {
      name: 'PACKIAMS',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&h=400&q=80',
      rating: 9.2,
      reviews: 2223,
      address: '72 Bd de Strasbourg, 75010, Paris',
      cuisine: 'French',
      avgPrice: '€19',
      offer: 'Up to -50% · TheFork Summer',
      yums: true
    },
    {
      name: 'Shalimar',
      image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&h=400&q=80',
      rating: 9.4,
      reviews: 4597,
      address: '92 Pass. Brady, 75010, Paris',
      cuisine: 'Indian',
      avgPrice: '€20',
      offer: 'Up to -50% · TheFork Summer',
      yums: true
    },
    {
      name: 'New Delhi',
      image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&h=400&q=80',
      rating: 9.4,
      reviews: 27339,
      address: '4 Pass. Brady, 75010, Paris',
      cuisine: 'Indian',
      avgPrice: '€21',
      offer: 'Up to -50% · TheFork Summer',
      yums: true
    },
    {
      name: 'Indichery',
      image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&h=400&q=80',
      rating: 8.5,
      reviews: 2553,
      address: '13 Pass. Brady, 75010, Paris',
      cuisine: 'Indian',
      avgPrice: '€14'
    },
    {
      name: 'Yasmin',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&h=400&q=80',
      rating: 9.3,
      reviews: 2517,
      address: '92 Pass. Brady, 75010, Paris',
      cuisine: 'Indian',
      avgPrice: '€29',
      offer: 'Up to -50% · TheFork Summer',
      yums: true
    },
    {
      name: 'Joon (cuisine népalaise)',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&h=400&q=80',
      rating: 9.5,
      reviews: 928,
      address: '6 Pass. Brady, 75010, Paris',
      cuisine: 'Nepalese',
      avgPrice: '€19',
      offer: 'Up to -50% · TheFork Summer',
      yums: true
    }
  ];
}

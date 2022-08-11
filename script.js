'use strict';



const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout{

    date = new Date();
    id = (Date.now()+ '').slice(-10);

    constructor(coords, distance, duration){
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
        
    }

    _setDescription(){
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this._setDescription = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]}
         ${this.date.getDate()}`;
    }
}

class Cycling extends Workout{
    type = 'cycling';

    constructor(coords, distance, duration, elevationGain){
        super(coords,distance,duration);
        this.elevationGain = elevationGain;
        
        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed(){
        this.speed = this.distance / (this.duration/60)
    }
}

class Running extends Workout{
    type = 'running';

    constructor(coords, distance, duration, cadance){
        super(coords, distance, duration);
        this.cadance = cadance;
        this.calcPace();
        this._setDescription();
    }

    calcPace(){
        // min/km
        this.pace = this.duration / this.distance;
        return this.pace
    }
}

class App{
#map
#zoomLevel = 15;
#mapEvent;
#workouts = [];

    constructor(){
        this._getPosition();

        //Data from local storage
        this._getLocalStorage();

        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener('click', this._movetoPopup.bind(this));


    }

    _getPosition(){
        if(navigator.geolocation)(
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),function(){
                    alert(`Could not get your location`);
                })
                );
    }

    _loadMap(position){
            const {latitude} = position.coords;
            const {longitude} = position.coords;
    
            const coords = [latitude, longitude]
    
             this.#map = L.map('map').setView(coords, this.#zoomLevel);
    
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.#map);
    
                //Handling MAPS
                this.#map.on('click', this._showForm.bind(this));

                this.#workouts.forEach(work => {
                    this.renderWorkoutMarker(work);
                })
    }

    _showForm(mapE){
        this.#mapEvent = mapE;
                    form.classList.remove('hidden');
                    inputDistance.focus();
    }

    _hideForm(){
        inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = '';

        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => {
            form.style.display = 'grid'
        }, 1000);
    }



    _toggleElevationField(){
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
            inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _newWorkout(e){

        e.preventDefault();
        const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));

        const allPositive = (...inputs) => inputs.every(inp => inp > 0);

//Get data from form
        const type = inputType.value;
        const distance = +inputDistance.value; //'+' to convert to a number
        const duration = +inputDuration.value;

        const {lat, lng} = this.#mapEvent.latlng;
        let workout;

        //If workout running create an object
        if(type === 'running'){
            const cadance = +inputCadence.value;
            if(
                !validInputs(distance, duration, cadance) || !allPositive(distance, duration, cadance)
                // !Number.isFinite(distance) || !Number.isFinite(duration) || !Number.isFinite(cadance)
            ) 
            return alert('Inputs have to be a positive numbers!')
            // console.log(!allPositive(distance, duration, distance));

            workout = new Running([lat,lng], distance,duration,cadance);
           
        }

        // If workout cycling create object
        if(type === 'cycling'){
            const elevation = +inputElevation.value;

            if(!validInputs(distance, duration, elevation) || !allPositive(distance, duration, elevation))
            return alert('Inputs have to be a positive numbers!')

            workout = new Cycling([lat,lng],distance,duration,elevation);
        }

        this.#workouts.push(workout);


        //Display Marker
        this.renderWorkoutMarker(workout);

        //Render list
        this._renderWorkout(workout);

        // clear input data
        this._hideForm()
        
        this._setLocalStorage();
        
    }
    // Display marker
    renderWorkoutMarker(workout){
        
        L.marker(workout.coords).addTo(this.#map)
        .bindPopup(L.popup({
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.type}-popup`
        }))
        .setPopupContent(`${workout.type === 'running'? '🏃‍♂️':'🚴‍♀️'} ${workout._setDescription}`)
        .openPopup();

    }

    _renderWorkout(workout){
        let html = `
            <li class="workout workout--${workout.type}" data-id="${workout.id}">
            <h2 class="workout__title">${workout._setDescription}</h2>
            <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running'?'🏃‍♂️':'🚴‍♀️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          `;
            if(workout.type === 'running'){
                html +=`
                <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
              </div>
              <div class="workout__details">
                <span class="workout__icon">👣</span>
                <span class="workout__value">${workout.cadance}</span>
                <span class="workout__unit">spm</span>
              </div>
            </li>
                `;
            }
            else{
                html += `
                <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
                `;
            }

                form.insertAdjacentHTML('afterend', html);
    }

    _movetoPopup(e){
        const workoutEl = e.target.closest('.workout');

        if(!workoutEl) return;

        const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id)
        this.#map.setView(workout.coords,this.#zoomLevel, {
            animate: true,
            pan: {
                duration: 1,
            }
        })
    }

    _setLocalStorage(){
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }

    _getLocalStorage(){
        const data = JSON.parse(localStorage.getItem('workouts'));

        if(!data) return;
        
        this.#workouts = data;
        this.#workouts.forEach(work => {
            this._renderWorkout(work);
        })
    }

    reset(){
        localStorage.removeItem('workouts');
        location.reload();
    }

}

const app = new App();
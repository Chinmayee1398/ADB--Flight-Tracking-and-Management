var type = 'metar', id = 'VEBS', c = 0, qry, p = $('p'), divs = $('div'), iframe = $('iframe'), value = $('input'), b = $('b'), rawText, diffIvl;

// Hide the map by default
$('#map-container').hide();

// Fetches data from AVWX.
async function avwxMain(id, type, airp, flag) {
    $('#msgBox').show(); // Show loading spinner
    var url = `https://avwx.rest/api/${type}/${id}?token=2r_H32HZ2AzCZDotC-1GetnWkIZhkBMpdq2W3rLRabI`;
    const res = await fetch(url);
    $('#msgBox').hide(); // Hide loading spinner
    if (!res.ok) {
        console.error('AVWX error:', res.status, res.type);
        alert('AVWX error: ' + res.status + ' - ' + res.type);
    }
    getHeaders(res);
    const data = await res.json();

    if (data.error) {
        console.error('Data error:', data.error);
        alert(data.error);
    }
    if (data.meta.validation_error)
        alert(data.meta.validation_error);
    var flc = data.flight_rules;

    // Clearing the previous data
    $('#data-table').empty();

    // Constructing the table with fetched data
    var table = `
        <tr><th>Type</th><td>${type.toUpperCase()}</td></tr>
        <tr><th>Airport</th><td>${airp}</td></tr>
        <tr><th>ICAO Code</th><td>${data.station}</td></tr>
        <tr><th>Reported</th><td>${getIST(data.time.dt)} <span id="updateDiff">${time(data.time.dt)}</span></td></tr>
        <tr><th>Temperature</th><td>${data.temperature.value}°C</td></tr>
        <tr><th>Dewpoint</th><td>${data.dewpoint.value}°C</td></tr>
        <tr><th>Humidity</th><td>${(data.relative_humidity * 100).toFixed(0)}%</td></tr>
        <tr><th>Wind</th><td>${data.wind_speed.value} Knot(s) (${(data.wind_speed.value * 1.85).toFixed(0)} KM/H - ${data.wind_direction.repr}°)</td></tr>
        <tr><th>Visibility</th><td>${data.visibility ? (data.visibility.value / 1000).toFixed(1) : 'N/A'} Km</td></tr>
        <tr><th>Pressure</th><td>${data.altimeter.value} hPa</td></tr>
        <tr><th>Condition</th><td>${data.wx_codes.map(code => code.value).join(', ')}</td></tr>
        <tr><th>Clouds</th><td>${data.clouds.map(cloud => `${cloud.type} at ${cloud.altitude * 100} ft AGL`).join(', ')}</td></tr>
        <tr><th>Raw</th><td>${data.raw}</td></tr>
        <tr><th>Category</th><td>${flc}</td></tr>
    `;
    $('#data-table').append(table);

    rawText = data.raw;

    // Show the map container after data is loaded
    $('#map-container').show();

    // Save the fetched data to the server
    saveWeatherData(data);
}

// Backbone of the website. Manipulates display property of important elements.
async function get() {
    $('#inp').blur();
    type = 'metar'; // Default to METAR
    inpVal = value[0].value.trim();
    if (!inpVal) {
        alert('Please enter Id!');
        return;
    }
    $('#data-table').empty();
    $('#msgBox').show(); // Show loading spinner
    const url = `https://avwx.rest/api/search/station?text=${inpVal}&token=2r_H32HZ2AzCZDotC-1GetnWkIZhkBMpdq2W3rLRabI`;
    const res = await fetch(url);
    $('#msgBox').hide(); // Hide loading spinner
    if (!res.ok) {
        if (res.status == 400)
            alert('Error: 400 - Location not found!');
        else
            alert('Search error: ' + res.status + ' ' + res.type);
        return;
    }
    const data = await res.json();
    id = data[0].icao;
    flag = data[0].country.toLowerCase();
    airp = `${data[0].name} ${data[0].city} ${data[0].state} ${data[0].country}`;
    if (data[0].name != qry)
        iframe.attr('src', `https://maps.google.com/maps?width=600&height=400&hl=en&q=${data[0].name}&t=&z=13&ie=UTF8&iwloc=B&output=embed`);
    qry = data[0].name;

    // Show the map after fetching the ICAO code information
    $('#map-container').show();

    avwxMain(id, type, airp, flag);
}

// Saves weather data to the server.
async function saveWeatherData(data) {
    try {
        const res = await fetch('/saveWeather', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to save weather data');
        console.log('Weather data saved successfully');
    } catch (error) {
        console.error(error.message);
    }
}

// Confirms if user wants to know about ICAO code redirects upon confirmation.
function info() {
    let reL = 'https://www.world-airport-codes.com';
    if (confirm(`METAR - Meteorological Aerodrome Report.\nTAF - Terminal Aerodrome Forecast.\nTo get ICAO click 'OK'.\n(redirects to ${reL})\nYour screen resolution: ${screen.width}×${screen.height}px`))
        window.open(reL);
}

// Converts UTC to IST.
function getIST(date) {
    let vr;
    if (typeof date == 'string')
        if (date.includes('Z'))
            vr = new Date(date);
        else
            vr = new Date(date + 'Z');
    else
        vr = new Date(date * 1000);

    let day = vr.getDate(),
        month = vr.getMonth() + 1,
        year = vr.getFullYear();
    vr = vr.toLocaleString().split('');
    return `${day}/${month}/${year} ${vr[1].replace(':00', '')}`;
}

// Returns time difference between issued time & an instance.
function time(t, x = 0) {
    x || hlp(t);
    var tm;
    if (t.charAt(t.length - 1) == 'Z')
        tm = ((new Date() - new Date(t)) / 60000).toFixed(0);
    else
        tm = ((new Date() - new Date(t + 'Z')) / 60000).toFixed(0);
    var hb = Math.ceil(tm / 60);
    if (hb > 1)
        return `[${hb - 1} hour(s) ago]`;
    return `[${tm} min(s) ago]`;
}

// Function for logging header metadata.
function getHeaders(response) {
    const headers = {};
    response.headers.forEach((value, name) => {
        headers[name] = value;
    });
}

// Updates time difference every 10s interval.
function hlp(t) {
    if (diffIvl)
        clearInterval(diffIvl);
    diffIvl = setInterval(() => {
        $('#updateDiff').text(time(t, 1));
    }, 5000);
}

// Arrow from fontawesome.com for variable wind animation.
function arrow(strt, end) {
    var i = $('.arrow');
    i.css({ '--start': (strt + 135) + 'deg', '--end': (end + 135) + 'deg' });
}

// Copy raw METAR or TAF to clipboard
$(document).on('click', '.fa-copy', () => {
    let copy = $('.fa-copy');
    navigator.clipboard.writeText(rawText);
    copy.toggleClass('fa-solid fa-sm fa-bounce fa-shake');
    setTimeout(() => {
        copy.toggleClass('fa-solid fa-sm fa-bounce fa-shake');
    }, 1000);
})

// Randomly picks a color & set it as "accent color" of input tags.
const colors = ['olive', 'teal', 'indianred', 'coral', 'lightcoral', 'salmon', 'cromson', 'turquoise', 'moccasin', 'peachpuff', 'khaki', 'orchid', 'darkmagenta', 'chartreuse', 'seagreen', 'mediumaquamarine', 'lightseagreen', 'navajowhite', 'burlywood', 'rosybrown', 'peru', 'sienna', 'lightcoral', 'lightseagreen', 'mistyrose'];
const clrs = colors[Math.floor(Math.random() * colors.length)];
var ob = (e) => {
    e.style.accentColor = clrs;
}

window.onload = function () {
    // Use setTimeout to ensure the page has fully loaded before scrolling
    setTimeout(function () {
        window.scrollTo(0, 1); // Scroll down to hide address bar
    }, 100);
};

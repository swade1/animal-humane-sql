# Animal Humane Web App Tab Details

## Tab 1: Overview
- **Header:** Logo, app title, user info
- **Stats Cards:**
  - Total number of currently available dogs
  - Total number of new dogs in the last 7 days
  - Total number of adoptions in the last 7 days 
  - Total number of trial adoptions 
  - Average length of stay in days for all currently available dogs
  - Dog that has been at the shelter the longest (number of days and clickable name)
  - Total number of Puppies, Adults, and Seniors that are currently available
---

## Tab 2: Recent Pupdates
- **Pupdate List:**
  - New Dogs List - dogs that appeared for the first time today
  - Returned Dogs List - dogs that were adopted and then returned
  - Adopted/Reclaimed Dogs List - dogs that were adopted today or strays that were reclaimed today
  - Trial Adoption Dogs List - dogs that are in a trial adoption
  - Available but Temporarily Unlisted List - dogs that are available and at the shelter but temporarily not on the website
  - Available Soon Dogs List - dogs that are at the shelter or in a foster home but that have never been on the website
  - Each name: clickable to open the iframe (new.shelterluv.com/embed/animal/{id})

---

## Tab 3: Current Population
- **Population Table/Grid:**
  - Columns: Dog name, location
  - Sortable by name or location
  - Dog name click: opens iframe with photos (new.shelterluv.com/embed/animal/{id}) 
---

## Tab 4: Adoptions
- **Adoption List:**
  - Table/list of recent adoptions
  - Columns: Dog name, date adopted, length of stay
  - Dog name click: opens iframe with photos (new.shelterluv.com/embed/animal/{id})  

---

## Tab 5: Insights & Spotlight
- **Charts/Graphs:**
**Adoption Trends:** 
A line chart with Daily Adoption Totals on the y-axis and dates on the x-axis. Each day, the total number of dogs adopted is plotted. A popup for each data point provides Date, the total Adoptions for that date, and the names of dogs adopted. On days when the shelter is closed or when no dogs are adopted, a data point of 0 is automatically plotted with a popup showing Date: nd Adoptions:0.

**Weekly Adoption Totals per Age Group** 
A grouped bar chart covering the last 10 weeks where each week starts on Monday. Each group of bars displays the total number of Adults, Puppies, and Senior dogs adopted for the week. The x-axis displays the legend with a green square for Puppies, a blue square for Adults and an orange square for Seniors. The y-axis shows a count for Adopted Dogs. The popup for each week shows the date (starting date for the week) and the total number adopted in each group. 

**Shelters and Rescues Transferring Dogs to Animal Humane** 
Text above the leaflet map showing shelter/rescue location says: 
"(n) shelters and rescues throughout New Mexico have partnered with Animal Humane to find homes for their dogs.  
Each pin represents a shelter that has transferred at least one dog to our care since July, 2025. 
Click on each pin to view shelter/rescue name and the number of dogs transferred from that location." 

The number of shelters is dynamically calculated based on the lookup table of shelters in animal-humane/shelterdog_tracker/elasticsearch_handler.py.  

The latitude and longitude for each pin are manually added to animal-humane/shelterdog_tracker/elasticsearch_handler.py as dogs from new locations arrive at the Animal Humane New Mexico shelter.
---

## Shared/Utility Components
- Header, TabNav, DogAvatar, DogCard, ManualEntryForm, LoadingSpinner, ErrorBanner
- All lists/tables support filtering, searching, and detail modals/drawers
- Manual entry/editing UI visible only to authorized users

---

**Notes:**
- Details and layouts are based on the AH Screenshots directory. Each tab reflects the actual UI elements, fields, and layouts visible in the screenshots.
- For further refinement, review each screenshot for additional fields, icons, or actions not listed above.

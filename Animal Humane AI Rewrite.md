# Animal Humane AI Rewrite

## Website Description and Functionality
animal-humane-static-demo.vercel.app is a website that provides regularly updated (but  not live) summarized and aggregated data and status for dogs at an animal shelter in Albuquerque, New Mexico. It does this by regularly scraping the animalhumanenm.org website and it's iframe components every 2 hours between the hours of 9am and 7pm MST, seven days a week. A subset of the data scraped is saved to an Elasticsearch datastore. Each scraping session automatically triggers a push of new data to a github repo which in turn triggers a Vercel deployment to show any updates. 

Most of the data saved to Elasticsearch is obtained by scraping the iframe components embedded in the animalhumanenm.org website. However, there are a few pieces of information that are added manually since they can only be obtained by visiting the site in person. This information includes each dog's origin, the latitude and longitude for the dog's origin, and the number of times a dog has been in bite quarantine.

### Problem
The website, while useful, is brittle and requires constant attention and manual updates multiple times per day. In short, it is not reliable. It currently outputs query results to the react-app/public/api directory in the form of .json files which the front end uses to populate the website. While this works and makes manual updates fairly easy, it's not very robust. Elasticsearch queries are executed programmatically, buried in the code, and not easy to modify when necessary, making code updates and corrections difficult. Building additional functionality into the existing framework is difficult and error prone.

### Solution
Re-create the existing code, functionality, and website such that the new Animal Humane web app is robust and extensible. The tech stack that should be used is: 
1. Frontend: Nextjs, Shadcn, Tailwindcss to be hosted on Vercel
2. Database: supabase

## Current Website and Code Functionality
The animalhumanenm.org website includes several iframes from which a subset of information is saved. The iframe components have the following format: 

```
<iframe-animal:animal="{"nid":212533931,"name":"Berry","uniqueId":"AHNM-A-84954","sex":"Female","location":"Main Kennel North, Main Campus - MKN-14","weight":12.11,"weight_units":"lbs","weight_group":"Small (0-24)","birthday":"1735542000","age_group":{"id":34669,"shelter_id":1255,"name":"Adult Dog","legacy_id":338269,"age_from":6,"from_unit":"months","age_to":5,"to_unit":"years","type":"Dog","default_group":1,"created_at":"2024-06-18T17:28:10.000000Z","updated_at":"2024-06-20T16:47:53.000000Z","deleted_at":null,"estimated_days":180,"age_from_in_days":180,"age_to_in_days":1825,"name_with_duration":"Adult Dog (6 months-5 years)","duration":"(6 months-5 years)"},"species":"Dog","breed":"Pomeranian","secondary_breed":"","primary_color":"Brown","secondary_color":"Black","attributes":["Bonded"],"photos":[{"id":35044188,"name":"IMG_6123.jpg","url":"https:\/\/new-s3.shelterluv.com\/profile-pictures\/4b5c4c072f2d00d404d1e7b08554e3f1\/d2f600d5bf416cd9a7193a3aa0f910df.jpg","isCover":false,"order_column":2},{"id":35050810,"name":"IMG_6152.jpg","url":"https:\/\/new-s3.shelterluv.com\/profile-pictures\/02e2af342314521a4329068fdd19ac31\/85bd019ca35048186a3fdf29746de811.jpg","isCover":false,"order_column":3},{"id":35050841,"name":"IMG_6175.jpg","url":"https:\/\/new-s3.shelterluv.com\/profile-pictures\/f652c218680e736df0c0c78129edf72c\/4e1d45da341b598efc20f499b4eb7083.jpg","isCover":false,"order_column":4},{"id":35538447,"name":"IMG_3941.jpeg","url":"https:\/\/new-s3.shelterluv.com\/profile-pictures\/e6011366eb974022c760fbfaf62d90b0\/fb8a18023f52373254e99a27c648b85f.jpeg","isCover":false,"order_column":10},{"id":35538458,"name":"IMG_3959.jpeg","url":"https:\/\/new-s3.shelterluv.com\/profile-pictures\/c557afe6713112a4ee227d54b6cc6053\/293e56c0de9dd493957b69e466ba87d5.jpeg","isCover":false,"order_column":11},{"id":35656333,"name":"IMG_4817.jpeg","url":"https:\/\/new-s3.shelterluv.com\/profile-pictures\/e0f7433db9cd087473977149e7c0e6de\/a28a3beabe4ce03e467ecb1a08994576.jpeg","isCover":true,"order_column":12}],"intake_date":"1767134240","public_url":"https:\/\/new.shelterluv.com\/embed\/animal\/212533931","videos":[],"adoptable":1,"kennel_description":"BONDED PAIR WITH POOKIE 84959!&lt;br \/&gt;\n&lt;br \/&gt;\nAre you looking for two sweet girls that need a second chance and a loving home? Look no further! &lt;br \/&gt;\n&lt;br \/&gt;\nBerry and Pookie are a sweet pair of sisters that had a rough start at life. These ladies came from a hoarding situation and gave birth to litters within days of each other. Together, these incredible moms coparented their puppies together and are now ready to find their new home! &lt;br \/&gt;\n&lt;br \/&gt;\nComing from a hoarding situation is hard. Hoarding dogs often don&#039;t have a lot of social interaction with people until they&#039;re removed from that lifestyle. Berry and Pookie are still learning to trust new people and can be avoidant of touching, but with patience, love, consistency, and care, they warm up quickly. They are new to walking on leash but LOVE to run around the play yard. Treats are the way to their heart, and while they are hesitant at first, they just need the right family to go at their pace. Since they are still shy around new people, please bring your entire household (especially kids) in to meet them before taking them home. They have successfully gotten along with other dogs but it&#039;s always a good idea to bring in your furry companion if you have one! ","adoptionFee":""}">
```


Data collected and saved to Elasticsearch is a combination of iframe data, extrapolated data, and data that is collected in person on site. The currently scraped and saved information is as follows: 

{
    "timestamp" : "2026-01-20T17:03:28-07:00",
    "id" : 208812347,
    "name" : "Loki",
    "location" : "Main Campus- Big Blue, BB-16",
    "origin" : "ABQ Animal Welfare Department",
    "status" : "Available",
    "url" : "https://new.shelterluv.com/embed/animal/208812347",
    "intake_date" : "2025-09-08",
    "length_of_stay_days" :135,
    "birthdate" : "2022-06-25",
    "age_group" : "Adult",
    "breed" : "Terrier, American Pit Bull",
    "secondary_breed" : "",
    "weight_group" : "Medium (25-59)",
    "color" : "Brown and Black",
    "bite_quarantine" : 0,
    "returned" : 0,
    "latitude" : 35.1102,
    "longitude" : -106.5823
}

## Elasticsearch Field Descriptions

**timestamp**: The datetime that the webscraping occurred. 
**id**: The unique id for each dog. This id also appears at the end of the "url" field. 
**name**: The name of the dog.  
**location**: The current physical location of the dog.  
**origin**: The location the dog was transferred from. This field can also be 'Owner Surrender' or 'Stray'. This information is only available at the shelter and must be added manually for each dog.
**status**: The status of the dog. Value in this field can be "Available","Adopted","Reclaimed", or "Euthanized".
**url**: The url to display the photos and information for the dog in this record. This url consists of "https://new.shelterluv.com/embed/animal/ + {id}". This url is used when dog's names are clickable on the website.
**intake_date**: The date the dog arrived at the shelter.
**length_of_stay_days**: The total number of days the dog has spent at the shelter. This value is calculated dynamically by counting the number of days since intake_date and the timestamp field.
**birthdate**: The date of birth for the dog as calculated by the age field on the scraped website. 
**age_group**: The age group of the dog based on the age field on the scraped website. Dogs 1 year or less are categorized as "Puppy", dogs more than 1 year and < 8 years are categorized as "Adult", and dogs older than 8 years are categorized as "Senior".
**breed**: The breed of dog as provided in the website field. For example, "Shepherd, Australian".
**secondary_breed**: If the breed field contains a forward slash ('/'), the shelterluv breed field is split into breed and secondary breed. For example, if the breed is "Terrier, Pit Bull / Mixed Breed (Large)", the information would be recorded as "breed":"Terrier, Pit Bull", "secondary_breed":"Mixed Breed (Large)".
**weight_group**: weight_group is scraped from the shelterluv site and is one of these three values: Small (0-24), Medium (25-59), and Large (60+). If it is not provided, it is extrapolated from the dog's weight as provided in the shelterluv weight field, not on the breed or secondary breed field.
**color**: The color field is a combination of "primary_color" and (if it exists) "secondary_color". These fields are available for scraping but not visible on the shelterluv site. If only primary_color is populated on the website, the color field is populated with the primary_color. If a secondary_color exists, it is concatenated with the primary_color and saved to the color field. For example, if a dog's primary_color is 'Tan' and secondary_color is 'White', the key, value pair is "color":"Tan and White".
**bite_quarantine**: A count of the number of times a dog has been in bite quarantine after biting a person. This field is updated manually based on data only available on site.
**returned**: A count of the number of times a dog has been returned after being adopted. 
**latitude**: The latitude of the dog's "origin" field. This will be 0 for dogs with an "origin" of "Stray" or "Owner Surrender". This value is available in a look up table if the origin's latitude already exists in the datastore. Otherwise, it is added manually for each new origin.
**longitude**: The longitude of the dog's "origin" field. This will be 0 for dogs with an "origin" of "Stray" or "Owner Surrender". This value is available in a look up table if the origin's longitude already exists in the datastore. Otherwise, it is added manually for each new origin.


## Website Tabs
## Overview Tab
    * Available Dogs: All dogs at the shelter with a non-empty location and "status":"Available"
    * New in the last 7 days: Total count of dogs that have appeared in the database in the last 7 calendar days.
    * Adopted in the last 7 days: Total count of dogs that have "status":"adopted" in the last 7 days
    * Trial Adoptions: Total count of dogs where substring "Trial Adoption" appears in "location". For example, "location":"Main Campus, Trial Adoption".
    * Average Length of Stay: The average of "length_of_stay_days" for all dogs with non-empty "location" field.
    * Longest Stay: The highest length_of_stay_days value for all dogs with non-empty "location" field. Include the dog's name as a clickable URL using the "url" field.
    * Available Dogs by Age Group: 
        * Puppies (0-1 year): Total number of dogs in the "Puppy" age group with non-empty location field
        * Adults (>1 year and < 8 years): Total number of dogs in the "Adult" age group with non-empty location field
        * Seniors (8+ years): Total number of dogs in the "Senior" age group with a non-empty location field
    
## Recent Pupdates Tab
"This tab shows recent changes in dog status and availability."

### New Dogs 
"We're new and making our debut!!" 

Names of dogs that are new to the database. The names of dogs should be clickable and direct users to the relevant new.shelterluv.com/embed/animal/{id} link. Dogs are considered 'new' for the entire day that the dog first appears. For example, if a dog appears on December 14, they should remain on this list until December 15.

### Returned Dogs 
"We're back!"

Names of dogs that have a previous document with "status":"adopted" and have been relisted on the animal humane website 

### Adopted/Reclaimed Dogs 
"We've been adopted!!!"

Names of dogs with a "status":"adopted" on the current date. 

### Trial Adoptions 
"We're checking out a potential new home and evaluating the quality of the treats and toys."

Dogs with the substring "Trial Adoption" in the "location" field. For example: "location":"Main Campus, Trial Adoption". Dogs appear in this section until "Trial Adoption" no longer appears in the "location" field. If the "status" field changes to "adopted", the dog's name should be removed from this category and added to the "Adopted/Reclaimed Dogs" list. 

### Available but Temporarily Unlisted
"We're taking a short break but we'll be back soon!"

Dogs with "status":"Available" but that do not appear in the current scraping run of data. Dogs in the category may have last appeared on the site several months prior but still have "status":"Available". Once dogs are relisted on the website, they should be removed from this category.

### Available Soon
"We're settling in and getting ready for our close-ups!"
Dogs that have been physically seen at the shelter but that have not yet appeared on the animalhumanenm.org website. These dogs are identified by their inclusion in the location_info.jsonl file and their absence in any historical datastore records or current scraping. Once a dog has appeared on the website, they should be removed from this category.

## Current Population Tab
All "status":"Available" dogs regardless of their location or whether they appear on the website or not. The location of dogs appear here next to their (clickable) names. For example: 

**Name**	            **Location**
Bruce	                Dog Treatment, T-02
Stray Hold- Cottonball	Dog Treatment, T-09
Stray Hold - Hopper	    Dog Treatment, T-10
Ginny	                Foster Home
Gandalf	                Foster Home
Athena	                Foster Home
Wess	                Main Campus - Behavior Office, Playroom
Sammy	                Main Campus - Behavior Office, Playroom 2
Brandy	                Main Campus - Main Kennel South, MKS-07
...

## Adoptions Tab 
Dogs that have been adopted over the last 8 calendar days including the date of adoption and the number of days at the shelter (length_of_stay_days). For example: 
**Name**	        **Date Adopted**	    **Days at Shelter**
Daenerys	        01/14/2026	                    15
Charmander	        01/14/2026	                    23
Hachi	            01/14/2026	                    90
Stromboli	        01/14/2026	                    98
Lucy	            01/14/2026	                     2
Rhino	            01/14/2026	                    14

## Insights & Spotlight Tab 
This tab includes the following visualizations:

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

## Additional Text Files. 
location_info.jsonl: This file consists of a list of all dogs that have passed through the shelter, are currently at the shelter, or that have been identified as registered by the shelter but that have not yet been made available officially.

The format of the file is in json and consists of the following as an example: 
{"name":"April","id":212009184,"origin":"Gallup McKinley County Humane Society","bite_quarantine":0,"returned":0,"latitude":35.543605,"longitude":-108.760272}

The bite_quarantine and returned values are updated manually. Any updates should be saved in the data store as they occur.

## Current Update Behavior vs Desired Update Behavior
**Current Behavior: Trial Adoption updates to Adoption:**  
Dogs in trial adoptions no longer appear on the animalhumanenm.org website. This means that new documents are not generated during regularly scheduled scraping. When a trial adoption is formalized, the most recent document in Elasticsearch is updated with "status":"adopted" and "location":"". 

**Desired Behavior: Trial Adoption updates to Adoption:**  
Instead of updating the most recent document with "status":"adopted" and "location":"", duplicate the most recent document with the current timestamp, updated length_of_stay_days field, "status":"adopted" and "location":"". This has the effect of counting dogs as adopted on the day they are adopted rather than the day they start a trial adoption. It also preserves the trial adoption information rather than overwriting it. 

**Current Behavior: Foster Home direct to Adoption:**. 
Dogs in foster homes often don't appear on the animalhumanenm.org website if they're too young to be adopted or they're recovering from an injury. This means that new documents are not generated during regularly scheduled scraping. When a dog in a foster home is adopted without returning to the website, the most recent document in Elasticsearch is updated with "status":"adopted" and "location":"".

**Desired Behavior: Foster Home direct to Adoption:**.
Instead of updating the most recent document with "status":"adopted" and "location":"", duplicate the most recent document with the current timestamp, updated length_of_stay_days field, "status":"adopted" and "location":"". This has the effect of counting dogs as adopted on the day they are adopted rather than the last day they appeared on the website. It also preserves the foster home information rather than overwriting it. 




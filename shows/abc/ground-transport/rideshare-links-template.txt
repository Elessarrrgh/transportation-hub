UBER DEEPLINK

Components
    Opening: https://m.uber.com/ul/?action=setPickup
    Latitude: "&pickup[latitude]=[LATITUDE-VALUE]"
    Longitude: "&pickup[longitude]=[LONGITUDE-VALUE]"
    Nickname: "&pickup[nickname]=[CONVENTION-CENTER-NAME]"
    Address: "&pickup[formatted_address]=[123-ADDRESS-ST],%20[CITY-NAME],%20[STATE]%20[ZIP]"
    
    (use %20 in place of spaces)

Full Example
    "https://m.uber.com/ul/?action=setPickup&pickup[latitude]=[LATITUDE-VALUE]&pickup[longitude]=[LONGITUDE-VALUE]&pickup[nickname]=[CONVENTION-CENTER-NAME]&pickup[formatted_address]=9[123-ADDRESS-ST],%20[CITY-NAME],%20[STATE]%20[ZIP]"



LYFT DEEPLINK

Components
    Opening: "https://lyft.com/ride?id=lyft " 
    Latitude: "&pickup[latitude]=[LATITUDE-VALLUE] "
    Longitude: "&pickup[longitude]=[LONGITUDE-VALUE] "
    Address: &pickup[address]=[123-ADDRESS-ST]%20[CITY-NAME]%20[STATE]%20[ZIP]
    
    (yes, those are intentional spaces at the end)
    (once again, use %20 in place of spaces)


Full Example
"https://lyft.com/ride?id=lyft &pickup[latitude]=[LATITUDE-VALUE] &pickup[longitude]=[LONGITUDE-VALUE] &pickup[address]=[123-ADDRESS-ST]%20[CITY-NAME]%20[STATE]%20[ZIP]"
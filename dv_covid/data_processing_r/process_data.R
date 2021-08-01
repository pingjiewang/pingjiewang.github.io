library(readr)
library(dplyr)

us_states <- read_csv("us-states.txt")
View(us_states)

o=order(us_states$state,us_states$date)
t=us_states[o,]
t$index=as.numeric(rownames(t))


t$cases_before=lag(t$cases) 
t$deaths_before=lag(t$deaths)

library(data.table)
DT <- data.table(t)
t1=DT[ , .SD[which.min(date)], by = state]
state_row1=t1$index

t[state_row1,"cases_before"]=0
t[state_row1,"deaths_before"]=0

t$cases_new=t$cases-t$cases_before
t$deaths_new=t$deaths-t$deaths_before

t$cases_new[t$cases_new<0] = 0
t$deaths_new[t$deaths_new<0] = 0

us_states1=t[,c("state","date","fips","cases","cases_new","deaths","cases_new")]

write.csv(us_states1,"us-states_processed.csv",quote=FALSE,row.names = FALSE)




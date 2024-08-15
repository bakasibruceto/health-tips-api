# API Used
- <a href="https://health.gov/our-work/national-health-initiatives/health-literacy/consumer-health-content/free-web-content/apis-developers" target="_blank">Health.gov</a>

# Response format
```bash
{
     "LastUpdated": "May 23, 2024",
     "title": "Choosing a Doctor: Quick Tips",
     "link": "https://health.gov/myhealthfinder/doctor-visits/regular-checkups/choosing-doctor-quick-tips",
     "content": "Primary care doctors usually work as part of a team with nurses or other doctors who will also help care for you. Treats you with respect Listens to your opinions and concerns Encourages you to ask questions Explains things in ways you understand"
}
```

# Health tips Category ID's
<table>
  <thead><tr><th>ID</th><th>English Category</th><th></th></tr></thead>
  <tbody>
  <tr><td>15</td><td>Cancer</td><td>14</td></tr>
  <tr><td>16</td><td>Diabetes</td><td>14</td></tr>
  <tr><td>18</td><td>Heart Health</td><td>17</td></tr>
  <tr><td>19</td><td>HIV</td><td>6</td></tr>
  <tr><td>109</td><td>Mental Health</td><td>11</td></tr
  <tr><td>21</td><td>Nutrition</td><td>13</td></tr>
  <tr><td>23</td><td>Obesity</td><td>10</td></tr>
  <tr><td>24</td><td>Physical Activity</td><td>9</td></tr>
  <tr><td>28</td><td>Sexual Health</td><td>15</td></tr>
  <tr><td>29</td><td>Vaccines</td><td>7</tr>
<tr><td></td><td><b>Total</td><td>116</td></tr>
  

  </tbody>
</table>


# Setup
```bash
cp .env.example .env
```

# Installation


```bash
py -m venv .venv
```

```bash
.\.venv\Scripts\Activate
```

```bash
pip install fastapi[all] uvicorn nltk requests pydantic sumy lxml[html_clean]
```

# Run
```bash
uvicorn main:app --reload
```

# **************************************************************************** #
#                                   FT_TRANSCENDENCE                           #
# **************************************************************************** #

NAME        := ft_transcendence
DOCKER      := docker compose
DC_FILE     := docker-compose.yml

# ------------------------- MAIN TARGETS ------------------------------------- #

all: up

up:
	$(DOCKER) -f $(DC_FILE) up --build -d

down:
	$(DOCKER) -f $(DC_FILE) down

logs:
	$(DOCKER) -f $(DC_FILE) logs -f

ps:
	$(DOCKER) -f $(DC_FILE) ps

# ------------------------- CLEANING TARGETS --------------------------------- #

clean:
	$(DOCKER) -f $(DC_FILE) down

fclean: down
	$(DOCKER) -f $(DC_FILE) down -v --rmi all --remove-orphans

re: fclean all

# ------------------------- QUALITY OF LIFE ---------------------------------- #

prune:
	docker system prune -af --volumes

.PHONY: all up down logs ps clean fclean re prune

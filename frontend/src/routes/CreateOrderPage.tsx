import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

const inputClassName =
  "h-10 min-w-0 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

const textareaClassName =
  "min-h-28 min-w-0 w-full resize-y rounded-md border border-input bg-background px-3 py-2.5 text-sm shadow-xs transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export function CreateOrderPage() {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto max-w-4xl">
        <header>
          <h1 className="text-xl font-medium">Создать заявку</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Укажите параметры груза и маршрут доставки. Заявка будет добавлена в
            общий пул для формирования сводного рейса.
          </p>
        </header>

        <form className="mt-6">
          <Card className="gap-0 rounded-lg border py-0 shadow-sm ring-0">
            <CardContent className="space-y-6 p-6 sm:p-8">
              <fieldset className="min-w-0">
                <legend className="text-sm font-semibold">Отправитель</legend>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="sender" className="text-sm font-medium">
                      Отправитель
                    </label>
                    <input
                      id="sender"
                      name="sender"
                      type="text"
                      autoComplete="organization"
                      spellCheck={false}
                      placeholder="Например, ИП Дәулет"
                      className={inputClassName}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium">
                      Телефон
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+7 (___) ___-__-__"
                      className={inputClassName}
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className="min-w-0 border-t pt-6">
                <legend className="text-sm font-semibold">Маршрут</legend>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="origin" className="text-sm font-medium">
                      Откуда
                    </label>
                    <input
                      id="origin"
                      name="origin"
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="Например, Актау"
                      className={inputClassName}
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="destination"
                      className="text-sm font-medium"
                    >
                      Куда
                    </label>
                    <input
                      id="destination"
                      name="destination"
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="Например, Шетпе"
                      className={inputClassName}
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className="min-w-0 border-t pt-6">
                <legend className="text-sm font-semibold">Груз</legend>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="cargo" className="text-sm font-medium">
                      Груз
                    </label>
                    <input
                      id="cargo"
                      name="cargo"
                      type="text"
                      autoComplete="off"
                      placeholder="Например, строительные материалы"
                      className={inputClassName}
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="packaging-type"
                      className="text-sm font-medium"
                    >
                      Тип упаковки
                    </label>
                    <input
                      id="packaging-type"
                      name="packagingType"
                      type="text"
                      autoComplete="off"
                      placeholder="Например, коробки"
                      className={inputClassName}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="weight-kg" className="text-sm font-medium">
                      Вес, кг
                    </label>
                    <input
                      id="weight-kg"
                      name="weightKg"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="200"
                      className={inputClassName}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="volume-m3" className="text-sm font-medium">
                      Объём, м³
                    </label>
                    <input
                      id="volume-m3"
                      name="volumeM3"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="1.5"
                      className={inputClassName}
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="package-count"
                      className="text-sm font-medium"
                    >
                      Количество мест
                    </label>
                    <input
                      id="package-count"
                      name="packageCount"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="10"
                      className={inputClassName}
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label
                      htmlFor="dimensions-note"
                      className="text-sm font-medium"
                    >
                      Габариты и примечание
                    </label>
                    <textarea
                      id="dimensions-note"
                      name="dimensionsNote"
                      rows={5}
                      placeholder="Например, 10 коробок 60×40×40 см. Хрупкий груз."
                      className={textareaClassName}
                    />
                  </div>
                </div>
              </fieldset>
            </CardContent>

            <CardFooter className="flex-col items-stretch gap-4 rounded-b-lg bg-muted/40 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <p className="max-w-xl text-xs leading-5 text-muted-foreground">
                После отправки заявка попадёт в общий пул и будет учтена при
                формировании сводного рейса.
              </p>
              <Button type="button" className="h-10 w-full px-4 sm:w-auto">
                Отправить заявку
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  )
}
